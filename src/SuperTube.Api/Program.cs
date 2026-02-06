using Microsoft.EntityFrameworkCore;
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

// Background service for processing downloads
builder.Services.AddSingleton<DownloadBackgroundService>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<DownloadBackgroundService>());

// Subscription service
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();

// Background service for subscription checks
builder.Services.AddHostedService<SubscriptionBackgroundService>();

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

    DbSeeder.Seed(db);
}

// Health check
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Map all endpoints
app.MapVideoEndpoints();
app.MapChannelEndpoints();
app.MapDownloadEndpoints();
app.MapSettingsEndpoints();
app.MapStatsEndpoints();
app.MapSubscriptionEndpoints();

app.Run();
