using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;
using WageTracker.API.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register Services
builder.Services.AddScoped<WageTracker.API.Services.IAuthService, WageTracker.API.Services.AuthService>();
builder.Services.AddScoped<WageTracker.API.Services.IJobService, WageTracker.API.Services.JobService>();
builder.Services.AddScoped<WageTracker.API.Services.IDailyEntryService, WageTracker.API.Services.DailyEntryService>();
builder.Services.AddScoped<WageTracker.API.Services.IDashboardService, WageTracker.API.Services.DashboardService>();
builder.Services.AddScoped<WageTracker.API.Services.IExpenseService, WageTracker.API.Services.ExpenseService>();
builder.Services.AddHttpClient<WageTracker.API.Services.IReceiptScanService, WageTracker.API.Services.ReceiptScanService>();
builder.Services.AddScoped<WageTracker.API.Services.IProfileService, WageTracker.API.Services.ProfileService>();
builder.Services.AddHttpClient<WageTracker.API.Services.ISubscriptionService, WageTracker.API.Services.SubscriptionService>();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

builder.Services.AddAuthorization();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context =>
    {
        var partitionKey = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 8,
            Window = TimeSpan.FromMinutes(1),
            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
            QueueLimit = 0
        });
    });
});

// Configure CORS
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        // Development: Allow all origins for easy testing
        options.AddPolicy("AllowAll", policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    }
    else
    {
        // Production: Only allow specific origins
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
            ?? Array.Empty<string>();
        
        // Log allowed origins for debugging
        Console.WriteLine($"[CORS] Allowed origins: {string.Join(", ", allowedOrigins)}");
        
        if (allowedOrigins.Length > 0)
        {
            options.AddPolicy("AllowAll", policy =>
            {
                policy.WithOrigins(allowedOrigins)
                      .AllowAnyMethod()
                      .AllowAnyHeader()
                      .AllowCredentials();
            });
        }
        else
        {
            throw new InvalidOperationException("Cors:AllowedOrigins must be configured in production.");
        }
    }
});

// Add OpenAPI/Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme. Enter your token in the text input below."
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Temporary compatibility patch for environments where the Users table
    // already exists but the weekly goal column has not been added yet.
    await dbContext.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE ""Users""
        ADD COLUMN IF NOT EXISTS ""WeeklyGoalAmount"" numeric(18,2) NULL;

        ALTER TABLE ""Users""
        ADD COLUMN IF NOT EXISTS ""BillingCustomerId"" character varying(100) NULL;

        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Users_BillingCustomerId""
        ON ""Users"" (""BillingCustomerId"");

        CREATE TABLE IF NOT EXISTS ""UserSubscriptions"" (
            ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            ""UserId"" integer NOT NULL REFERENCES ""Users""(""Id"") ON DELETE CASCADE,
            ""EntitlementId"" character varying(100) NOT NULL,
            ""ProductId"" character varying(150) NULL,
            ""Status"" integer NOT NULL DEFAULT 0,
            ""PlanTerm"" integer NOT NULL DEFAULT 0,
            ""Store"" integer NOT NULL DEFAULT 0,
            ""IsPremium"" boolean NOT NULL DEFAULT false,
            ""WillRenew"" boolean NOT NULL DEFAULT false,
            ""ExpiresAt"" timestamp with time zone NULL,
            ""LastSyncedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_UserSubscriptions_UserId""
        ON ""UserSubscriptions"" (""UserId"");

        CREATE TABLE IF NOT EXISTS ""RevenueCatWebhookEvents"" (
            ""Id"" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            ""EventId"" character varying(150) NOT NULL,
            ""EventType"" character varying(100) NOT NULL,
            ""AppUserId"" character varying(100) NULL,
            ""Payload"" text NOT NULL,
            ""ReceivedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
            ""ProcessedAt"" timestamp with time zone NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_RevenueCatWebhookEvents_EventId""
        ON ""RevenueCatWebhookEvents"" (""EventId"");
    ");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CORS must be before auth
app.UseCors("AllowAll");

app.UseRateLimiter();

// Skip HTTPS redirect in development
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Health check endpoint for container orchestration
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.MapGet("/account-deletion", (IConfiguration configuration) =>
{
    var supportEmail = configuration["Support:Email"] ?? "support@wagetracker.xyz";
    var html = $"""
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Delete Your WageTracker Account</title>
        </head>
        <body>
            <main style="font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif; max-width: 680px; margin: 40px auto; padding: 0 20px; line-height: 1.6;">
                <h1>Delete Your WageTracker Account</h1>
                <p>You can delete your account inside the WageTracker app from Profile &gt; Help &amp; Support &gt; Delete account in app.</p>
                <p>Deleting your account removes your profile, jobs, wage entries, expenses, weekly goals, and subscription access snapshot from WageTracker.</p>
                <p>If you cannot access the app, email <a href="mailto:{supportEmail}">{supportEmail}</a> from the email address on your account and ask us to delete it.</p>
            </main>
        </body>
        </html>
        """;

    return Results.Content(html, "text/html");
});

app.Run();
