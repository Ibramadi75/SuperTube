using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;
using SuperTube.Api.Endpoints;

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

app.Run();
