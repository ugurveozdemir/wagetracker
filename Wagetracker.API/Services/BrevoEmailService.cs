using System.Text;
using System.Text.Json;

namespace WageTracker.API.Services
{
    public class BrevoEmailService : IEmailService
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public BrevoEmailService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task SendPasswordResetCodeAsync(string toEmail, string resetCode, CancellationToken cancellationToken = default)
        {
            var provider = _configuration["Email:Provider"] ?? "Brevo";
            if (!provider.Equals("Brevo", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException("Email provider is not configured for Brevo.");
            }

            var apiKey = _configuration["Email:ApiKey"];
            var fromEmail = _configuration["Email:FromEmail"];
            var fromName = _configuration["Email:FromName"] ?? "Chickaree";

            if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException("Email configuration is incomplete.");
            }

            var payload = new
            {
                sender = new
                {
                    email = fromEmail,
                    name = fromName
                },
                to = new[]
                {
                    new { email = toEmail }
                },
                subject = "Your Chickaree password reset code",
                htmlContent = BuildPasswordResetHtml(resetCode),
                textContent = $"Your Chickaree password reset code is {resetCode}. This code expires in 15 minutes."
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.brevo.com/v3/smtp/email");
            request.Headers.Add("api-key", apiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");

            using var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException("Email provider failed while sending reset code.");
            }
        }

        private static string BuildPasswordResetHtml(string resetCode)
        {
            return $"""
                <!doctype html>
                <html lang=\"en\">
                <head>
                    <meta charset=\"utf-8\" />
                    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
                    <title>Password Reset</title>
                </head>
                <body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px;\">
                    <main style=\"max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 14px; padding: 24px; border: 1px solid #e2e8f0;\">
                        <h1 style=\"margin: 0 0 16px; font-size: 22px;\">Reset your password</h1>
                        <p style=\"margin: 0 0 14px; line-height: 1.6;\">Use the code below to reset your Chickaree password. The code expires in 15 minutes.</p>
                        <div style=\"margin: 18px 0; padding: 14px; text-align: center; border-radius: 10px; background: #f1f5f9; border: 1px dashed #94a3b8; font-size: 30px; letter-spacing: 6px; font-weight: 700;\">{resetCode}</div>
                        <p style=\"margin: 0; line-height: 1.6; color: #334155;\">If you did not request this, you can safely ignore this email.</p>
                    </main>
                </body>
                </html>
                """;
        }
    }
}
