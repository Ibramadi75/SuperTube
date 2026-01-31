using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;

namespace SuperTube.Api.Endpoints;

public static class DownloadEndpoints
{
    public static void MapDownloadEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/downloads");

        // GET /api/downloads - List all downloads
        group.MapGet("/", async (AppDbContext db, string? status) =>
        {
            var query = db.Downloads.OrderByDescending(d => d.StartedAt).AsQueryable();

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<DownloadStatus>(status, true, out var statusEnum))
            {
                query = query.Where(d => d.Status == statusEnum);
            }

            var downloads = await query.ToListAsync();
            return Results.Ok(new { data = downloads });
        });

        // GET /api/downloads/{id} - Get download by ID
        group.MapGet("/{id}", async (string id, AppDbContext db) =>
        {
            var download = await db.Downloads.FindAsync(id);
            return download is not null
                ? Results.Ok(new { data = download })
                : Results.NotFound(new { error = new { code = "DOWNLOAD_NOT_FOUND", message = $"Download '{id}' not found" } });
        });

        // POST /api/downloads - Start a new download
        group.MapPost("/", async (DownloadRequest request, AppDbContext db) =>
        {
            // Validate URL
            if (string.IsNullOrWhiteSpace(request.Url))
                return Results.BadRequest(new { error = new { code = "INVALID_URL", message = "URL is required" } });

            if (!IsValidYouTubeUrl(request.Url))
                return Results.BadRequest(new { error = new { code = "INVALID_URL", message = "Invalid YouTube URL" } });

            var download = new Download
            {
                Id = Guid.NewGuid().ToString("N")[..12],
                Url = request.Url,
                Status = DownloadStatus.Pending,
                Progress = 0,
                StartedAt = DateTime.UtcNow,
                Quality = request.Quality ?? "1080p",
                ConcurrentFragments = request.ConcurrentFragments ?? 4
            };

            db.Downloads.Add(download);
            await db.SaveChangesAsync();

            // TODO: Actually trigger the download via yt-dlp API (Phase 4)

            return Results.Created($"/api/downloads/{download.Id}", new { data = download });
        });

        // DELETE /api/downloads/{id} - Cancel a download
        group.MapDelete("/{id}", async (string id, AppDbContext db) =>
        {
            var download = await db.Downloads.FindAsync(id);
            if (download is null)
                return Results.NotFound(new { error = new { code = "DOWNLOAD_NOT_FOUND", message = $"Download '{id}' not found" } });

            if (download.Status == DownloadStatus.Completed)
                return Results.BadRequest(new { error = new { code = "ALREADY_COMPLETED", message = "Cannot cancel a completed download" } });

            // TODO: Actually cancel the download via yt-dlp API (Phase 4)

            download.Status = DownloadStatus.Failed;
            download.Error = "Cancelled by user";
            download.CompletedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new { data = download });
        });
    }

    private static bool IsValidYouTubeUrl(string url)
    {
        var patterns = new[]
        {
            @"^https?://(www\.)?youtube\.com/watch\?v=[\w-]+",
            @"^https?://(www\.)?youtube\.com/shorts/[\w-]+",
            @"^https?://youtu\.be/[\w-]+",
            @"^https?://(www\.)?youtube\.com/live/[\w-]+"
        };

        return patterns.Any(p => System.Text.RegularExpressions.Regex.IsMatch(url, p));
    }
}

public record DownloadRequest(string Url, string? Quality, int? ConcurrentFragments);
