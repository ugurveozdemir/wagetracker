using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Security.Claims;
using System.Text;
using WageTracker.API.Data;
using WageTracker.API.Models.DTOs;
using WageTracker.API.Models.Entities;

namespace WageTracker.API.Services
{
    public class AuthService : IAuthService
    {
        private const int ResetCodeLength = 6;
        private const int MaxResetFailedAttempts = 5;
        private static readonly TimeSpan ResetCodeLifetime = TimeSpan.FromMinutes(15);
        private static readonly TimeSpan ResetRequestCooldown = TimeSpan.FromMinutes(1);
        private const string InvalidResetCodeMessage = "Invalid or expired code";

        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ISubscriptionService _subscriptionService;
        private readonly IEmailService _emailService;

        public AuthService(
            AppDbContext context,
            IConfiguration configuration,
            ISubscriptionService subscriptionService,
            IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _subscriptionService = subscriptionService;
            _emailService = emailService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var normalizedEmail = NormalizeEmail(request.Email);

            // Check if user already exists
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
            {
                throw new InvalidOperationException("User with this email already exists");
            }

            // Hash password
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Create user
            var user = new User
            {
                Email = normalizedEmail,
                PasswordHash = passwordHash,
                FullName = request.FullName,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Generate token
            var token = GenerateJwtToken(user);

            return new AuthResponse
            {
                Token = token,
                User = await _subscriptionService.BuildUserDtoAsync(user)
            };
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            // Find user
            var user = await FindUserByEmailAsync(request.Email);
            if (user == null)
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid email or password");
            }

            // Generate token
            var token = GenerateJwtToken(user);

            return new AuthResponse
            {
                Token = token,
                User = await _subscriptionService.BuildUserDtoAsync(user)
            };
        }

        public async Task RequestPasswordResetAsync(ForgotPasswordRequest request)
        {
            var user = await FindUserByEmailAsync(request.Email);
            if (user == null)
            {
                return;
            }

            var now = DateTime.UtcNow;
            var activeToken = await _context.PasswordResetTokens
                .Where(token => token.UserId == user.Id && token.UsedAt == null)
                .OrderByDescending(token => token.CreatedAt)
                .FirstOrDefaultAsync();

            if (activeToken != null)
            {
                if (activeToken.ExpiresAt <= now || activeToken.FailedAttempts >= MaxResetFailedAttempts)
                {
                    activeToken.UsedAt = now;
                    await _context.SaveChangesAsync();
                }
                else if (now - activeToken.CreatedAt < ResetRequestCooldown)
                {
                    return;
                }
                else
                {
                    activeToken.UsedAt = now;
                    await _context.SaveChangesAsync();
                }
            }

            var resetCode = GenerateResetCode();
            var token = new PasswordResetToken
            {
                UserId = user.Id,
                CodeHash = ComputeCodeHash(user.Id, resetCode),
                ExpiresAt = now.Add(ResetCodeLifetime),
                CreatedAt = now,
                FailedAttempts = 0
            };

            _context.PasswordResetTokens.Add(token);
            await _context.SaveChangesAsync();

            try
            {
                await _emailService.SendPasswordResetCodeAsync(user.Email, resetCode);
            }
            catch
            {
                token.UsedAt = now;
                await _context.SaveChangesAsync();
                throw;
            }
        }

        public async Task ResetPasswordAsync(ResetPasswordRequest request)
        {
            var user = await FindUserByEmailAsync(request.Email);
            if (user == null)
            {
                throw new UnauthorizedAccessException(InvalidResetCodeMessage);
            }

            var now = DateTime.UtcNow;
            var token = await _context.PasswordResetTokens
                .Where(candidate => candidate.UserId == user.Id && candidate.UsedAt == null)
                .OrderByDescending(candidate => candidate.CreatedAt)
                .FirstOrDefaultAsync();

            if (token == null)
            {
                throw new UnauthorizedAccessException(InvalidResetCodeMessage);
            }

            if (token.ExpiresAt <= now || token.FailedAttempts >= MaxResetFailedAttempts)
            {
                token.UsedAt = now;
                await _context.SaveChangesAsync();
                throw new UnauthorizedAccessException(InvalidResetCodeMessage);
            }

            var providedCodeHash = ComputeCodeHash(user.Id, request.Code.Trim());
            if (!IsCodeHashMatch(token.CodeHash, providedCodeHash))
            {
                token.FailedAttempts += 1;
                if (token.FailedAttempts >= MaxResetFailedAttempts)
                {
                    token.UsedAt = now;
                }

                await _context.SaveChangesAsync();
                throw new UnauthorizedAccessException(InvalidResetCodeMessage);
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            var outstandingTokens = await _context.PasswordResetTokens
                .Where(candidate => candidate.UserId == user.Id && candidate.UsedAt == null)
                .ToListAsync();

            foreach (var outstandingToken in outstandingTokens)
            {
                outstandingToken.UsedAt = now;
            }

            await _context.SaveChangesAsync();
        }

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            var expiryMinutes = int.Parse(jwtSettings["ExpiryInMinutes"] ?? "1440");

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<User?> FindUserByEmailAsync(string email)
        {
            var normalizedEmail = NormalizeEmail(email);
            return await _context.Users.FirstOrDefaultAsync(user => user.Email.ToLower() == normalizedEmail);
        }

        private static string NormalizeEmail(string email)
        {
            return email.Trim().ToLowerInvariant();
        }

        private string ComputeCodeHash(int userId, string code)
        {
            var pepper = _configuration["PasswordReset:Pepper"];
            if (string.IsNullOrWhiteSpace(pepper))
            {
                throw new InvalidOperationException("Password reset pepper is not configured.");
            }

            var payload = $"{userId}:{code}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(pepper));
            var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
            return Convert.ToHexString(hashBytes);
        }

        private static bool IsCodeHashMatch(string leftHash, string rightHash)
        {
            if (leftHash.Length != rightHash.Length)
            {
                return false;
            }

            return CryptographicOperations.FixedTimeEquals(
                Encoding.UTF8.GetBytes(leftHash),
                Encoding.UTF8.GetBytes(rightHash));
        }

        private static string GenerateResetCode()
        {
            var code = RandomNumberGenerator.GetInt32(0, (int)Math.Pow(10, ResetCodeLength));
            return code.ToString($"D{ResetCodeLength}");
        }
    }
}
