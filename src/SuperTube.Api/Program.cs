using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SuperTube.Api.Data;
using SuperTube.Api.Endpoints;
using SuperTube.Api.Services;

var builder = WebApplication.CreateSlimBuilder(args);

// Configuration
var dataPath = Environment.GetEnvironmentVariable("DATA_PATH") ?? "./data";
var dbPath = Path.Combine(dataPath, "supertube.db");
var ytdlpApiUrl = Environment.GetEnvironmentVariable("YTDLP_API_URL") ?? "http://localhost:3001";

// Ensure data directory exists
Directory.CreateDirectory(dataPath);

// SQLite + EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// YtdlpService with HttpClient
builder.Services.AddHttpClient<IYtdlpService, YtdlpService>(client =>
{
    client.BaseAddress = new Uri(ytdlpApiUrl);
    client.Timeout = TimeSpan.FromMinutes(5);
});

// HttpClient for Ntfy notifications
builder.Services.AddHttpClient();

// Auth service
builder.Services.AddSingleton(new AuthService());

// Background service for processing downloads
builder.Services.AddSingleton<DownloadBackgroundService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<DownloadBackgroundService>());

// Subscription service
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();

// Background service for subscription checks
builder.Services.AddHostedService<SubscriptionBackgroundService>();

// JWT Authentication (per-user secret, fully validated in OnMessageReceived)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = false,
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = false
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = async context =>
            {
                // Extract token from Authorization header
                string? token = null;
                var auth = context.Request.Headers.Authorization.FirstOrDefault();
                if (auth?.StartsWith("Bearer ") == true)
                    token = auth["Bearer ".Length..];

                // Support token in query string for SSE/stream/thumbnail endpoints
                if (token is null)
                {
                    var path = context.HttpContext.Request.Path;
                    if (path.StartsWithSegments("/api/downloads") && path.Value?.Contains("/progress") == true
                        || path.StartsWithSegments("/api/videos") && (path.Value?.Contains("/stream") == true || path.Value?.Contains("/thumbnail") == true))
                    {
                        token = context.Request.Query["token"].FirstOrDefault();
                    }
                }

                if (string.IsNullOrEmpty(token))
                    return;

                try
                {
                    var handler = new JwtSecurityTokenHandler();
                    if (!handler.CanReadToken(token))
                    {
                        context.Fail("Invalid token format");
                        return;
                    }

                    var jwt = handler.ReadJwtToken(token);
                    var userId = jwt.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier || c.Type == "nameid")?.Value;
                    if (userId is null)
                    {
                        context.Fail("Missing user ID claim");
                        return;
                    }

                    var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                    var user = await db.Users.FindAsync(userId);
                    if (user?.JwtSecret is null)
                    {
                        context.Fail("User not found");
                        return;
                    }

                    if (!AuthService.ValidateTokenSignature(token, user.JwtSecret))
                    {
                        context.Fail("Invalid token signature");
                        return;
                    }

                    var identity = new ClaimsIdentity(jwt.Claims.Select(c => c.Type switch
                    {
                        "nameid" => new Claim(ClaimTypes.NameIdentifier, c.Value),
                        "unique_name" => new Claim(ClaimTypes.Name, c.Value),
                        "role" => new Claim(ClaimTypes.Role, c.Value),
                        _ => c
                    }), "Bearer", ClaimTypes.Name, ClaimTypes.Role);

                    context.Principal = new ClaimsPrincipal(identity);
                    context.Success();
                }
                catch
                {
                    context.Fail("Token validation failed");
                }
            }
        };
    });

builder.Services.AddAuthorization();

// CORS for development
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Enable CORS
app.UseCors();

// Global error handler
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            error = new
            {
                code = "INTERNAL_ERROR",
                message = app.Environment.IsDevelopment() ? ex.Message : "An unexpected error occurred"
            }
        });
    }
});

app.UseAuthentication();
app.UseAuthorization();

// Auto-migrate database and seed
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // Migration: Add new columns to Videos table (for existing databases)
    try
    {
        db.Database.ExecuteSqlRaw(@"
            ALTER TABLE Videos ADD COLUMN PublishedAt TEXT NULL;
        ");
    }
    catch { /* Column already exists */ }

    try
    {
        db.Database.ExecuteSqlRaw(@"
            ALTER TABLE Videos ADD COLUMN ChannelId TEXT NULL;
        ");
    }
    catch { /* Column already exists */ }

    // Migration: Create Subscriptions table if not exists
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS Subscriptions (
            Id TEXT NOT NULL PRIMARY KEY,
            ChannelId TEXT NOT NULL,
            ChannelName TEXT NOT NULL,
            ChannelUrl TEXT NOT NULL,
            IsActive INTEGER NOT NULL DEFAULT 1,
            SubscribedAt TEXT NOT NULL,
            LastCheckedAt TEXT NULL,
            LastVideoDate TEXT NOT NULL,
            TotalDownloaded INTEGER NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS IX_Subscriptions_ChannelId ON Subscriptions(ChannelId);
        CREATE INDEX IF NOT EXISTS IX_Subscriptions_IsActive ON Subscriptions(IsActive);
    ");

    // Migration: Create indexes on Videos table
    try
    {
        db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_Videos_PublishedAt ON Videos(PublishedAt DESC);");
        db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_Videos_ChannelId ON Videos(ChannelId);");
    }
    catch { /* Indexes might already exist */ }

    // Migration: Users table
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS Users (
            Id TEXT NOT NULL PRIMARY KEY,
            Username TEXT NOT NULL,
            PasswordHash TEXT NOT NULL,
            DisplayName TEXT NOT NULL,
            Role TEXT NOT NULL,
            CreatedAt TEXT NOT NULL,
            StorageQuotaBytes INTEGER NULL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS IX_Users_Username ON Users(Username);
    ");

    // Migration: UserSettings table
    db.Database.ExecuteSqlRaw(@"
        CREATE TABLE IF NOT EXISTS UserSettings (
            Key TEXT NOT NULL,
            UserId TEXT NOT NULL,
            Value TEXT NOT NULL,
            PRIMARY KEY (Key, UserId)
        );
    ");

    // Migration: Add UserId columns
    try { db.Database.ExecuteSqlRaw("ALTER TABLE Videos ADD COLUMN UserId TEXT NULL;"); }
    catch { /* Column already exists */ }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE Downloads ADD COLUMN UserId TEXT NULL;"); }
    catch { /* Column already exists */ }
    try { db.Database.ExecuteSqlRaw("ALTER TABLE Subscriptions ADD COLUMN UserId TEXT NULL;"); }
    catch { /* Column already exists */ }

    // Migration: Indexes on UserId
    try { db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_Videos_UserId ON Videos(UserId);"); }
    catch { /* Index might already exist */ }
    try { db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_Downloads_UserId ON Downloads(UserId);"); }
    catch { /* Index might already exist */ }
    try { db.Database.ExecuteSqlRaw("CREATE INDEX IF NOT EXISTS IX_Subscriptions_UserId ON Subscriptions(UserId);"); }
    catch { /* Index might already exist */ }

    // Migration: Add JwtSecret to Users
    try { db.Database.ExecuteSqlRaw("ALTER TABLE Users ADD COLUMN JwtSecret TEXT NULL;"); }
    catch { /* Column already exists */ }

    // Generate JwtSecret for existing users that don't have one
    var usersWithoutSecret = db.Users.Where(u => u.JwtSecret == null).ToList();
    foreach (var u in usersWithoutSecret)
    {
        u.JwtSecret = AuthService.GenerateSecret();
    }
    if (usersWithoutSecret.Count > 0)
        db.SaveChanges();

    DbSeeder.Seed(db);
}

// Health check
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Map all endpoints
app.MapAuthEndpoints();
app.MapVideoEndpoints();
app.MapChannelEndpoints();
app.MapDownloadEndpoints();
app.MapSettingsEndpoints();
app.MapStatsEndpoints();
app.MapSubscriptionEndpoints();

app.Run();
