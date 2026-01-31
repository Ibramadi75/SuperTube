using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;

var builder = WebApplication.CreateSlimBuilder(args);

// Configuration
var dataPath = Environment.GetEnvironmentVariable("DATA_PATH") ?? "./data";
var dbPath = Path.Combine(dataPath, "supertube.db");

// Ensure data directory exists
Directory.CreateDirectory(dataPath);

// SQLite + EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

var app = builder.Build();

// Auto-migrate database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

// Health check
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

// Placeholder endpoints (will be implemented in Phase 3)
app.MapGet("/api/videos", () => Results.Ok(new { data = Array.Empty<object>() }));
app.MapGet("/api/downloads", () => Results.Ok(new { data = Array.Empty<object>() }));
app.MapGet("/api/settings", () => Results.Ok(new { data = new { quality = "1080p" } }));
app.MapGet("/api/stats", () => Results.Ok(new { data = new { totalVideos = 0, totalSize = 0 } }));

app.Run();
