using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;

namespace SuperTube.Api.Endpoints;

public static class ChannelEndpoints
{
    public static void MapChannelEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/channels");

        // GET /api/channels - List all channels (grouped by uploader)
        group.MapGet("/", async (AppDbContext db) =>
        {
            var channels = await db.Videos
                .GroupBy(v => v.Uploader)
                .Select(g => new
                {
                    name = g.Key,
                    videoCount = g.Count(),
                    totalSize = g.Sum(v => v.Filesize ?? 0),
                    latestVideo = g.Max(v => v.DownloadedAt)
                })
                .OrderByDescending(c => c.latestVideo)
                .ToListAsync();

            return Results.Ok(new { data = channels });
        });

        // GET /api/channels/{name} - Get videos for a channel
        group.MapGet("/{name}", async (string name, AppDbContext db) =>
        {
            var decodedName = Uri.UnescapeDataString(name);
            var videos = await db.Videos
                .Where(v => v.Uploader == decodedName)
                .OrderByDescending(v => v.DownloadedAt)
                .ToListAsync();

            if (!videos.Any())
                return Results.NotFound(new { error = new { code = "CHANNEL_NOT_FOUND", message = $"Channel '{decodedName}' not found" } });

            return Results.Ok(new { data = videos });
        });

        // DELETE /api/channels/{name} - Delete all videos from a channel
        group.MapDelete("/{name}", async (string name, AppDbContext db) =>
        {
            var decodedName = Uri.UnescapeDataString(name);
            var videos = await db.Videos
                .Where(v => v.Uploader == decodedName)
                .ToListAsync();

            if (!videos.Any())
                return Results.NotFound(new { error = new { code = "CHANNEL_NOT_FOUND", message = $"Channel '{decodedName}' not found" } });

            // Delete files
            foreach (var video in videos)
            {
                if (File.Exists(video.Filepath))
                    File.Delete(video.Filepath);
                if (video.ThumbnailPath is not null && File.Exists(video.ThumbnailPath))
                    File.Delete(video.ThumbnailPath);
            }

            db.Videos.RemoveRange(videos);
            await db.SaveChangesAsync();

            return Results.Ok(new { data = new { deletedCount = videos.Count } });
        });
    }
}
