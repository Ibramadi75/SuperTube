using Microsoft.EntityFrameworkCore;
using SuperTube.Api.Data;
using SuperTube.Api.Services;

namespace SuperTube.Api.Endpoints;

public static class VideoEndpoints
{
    public static void MapVideoEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/videos").RequireAuthorization();

        // GET /api/videos - List all videos
        group.MapGet("/", async (AppDbContext db, HttpContext httpContext, int? limit, int? offset) =>
        {
            var userId = httpContext.GetUserId();
            var query = db.Videos
                .Where(v => v.UserId == userId)
                .OrderByDescending(v => v.PublishedAt ?? v.DownloadedAt)
                .AsQueryable();

            if (offset.HasValue)
                query = query.Skip(offset.Value);

            if (limit.HasValue)
                query = query.Take(limit.Value);

            var videos = await query.ToListAsync();
            var total = await db.Videos.CountAsync(v => v.UserId == userId);

            return Results.Ok(new { data = videos, total });
        });

        // GET /api/videos/{id} - Get video by ID
        group.MapGet("/{id}", async (string id, AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId();
            var video = await db.Videos.FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);
            return video is not null
                ? Results.Ok(new { data = video })
                : Results.NotFound(new { error = new { code = "VIDEO_NOT_FOUND", message = $"Video '{id}' not found" } });
        });

        // DELETE /api/videos/{id} - Delete video
        group.MapDelete("/{id}", async (string id, AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId();
            var video = await db.Videos.FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);
            if (video is null)
                return Results.NotFound(new { error = new { code = "VIDEO_NOT_FOUND", message = $"Video '{id}' not found" } });

            if (File.Exists(video.Filepath))
                File.Delete(video.Filepath);
            if (video.ThumbnailPath is not null && File.Exists(video.ThumbnailPath))
                File.Delete(video.ThumbnailPath);

            db.Videos.Remove(video);
            await db.SaveChangesAsync();

            return Results.NoContent();
        });

        // GET /api/videos/{id}/stream - Stream video file
        group.MapGet("/{id}/stream", async (string id, AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId();
            var video = await db.Videos.FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);
            if (video is null)
                return Results.NotFound(new { error = new { code = "VIDEO_NOT_FOUND", message = $"Video '{id}' not found" } });

            if (!File.Exists(video.Filepath))
                return Results.NotFound(new { error = new { code = "FILE_NOT_FOUND", message = "Video file not found on disk" } });

            return Results.File(video.Filepath, "video/mp4", enableRangeProcessing: true);
        });

        // GET /api/videos/{id}/thumbnail - Get thumbnail
        group.MapGet("/{id}/thumbnail", async (string id, AppDbContext db, HttpContext httpContext) =>
        {
            var userId = httpContext.GetUserId();
            var video = await db.Videos.FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);
            if (video is null)
                return Results.NotFound(new { error = new { code = "VIDEO_NOT_FOUND", message = $"Video '{id}' not found" } });

            if (video.ThumbnailPath is null || !File.Exists(video.ThumbnailPath))
                return Results.NotFound(new { error = new { code = "THUMBNAIL_NOT_FOUND", message = "Thumbnail not found" } });

            return Results.File(video.ThumbnailPath, "image/jpeg");
        });

        // POST /api/videos/{id}/refresh - Refresh video metadata
        group.MapPost("/{id}/refresh", async (string id, AppDbContext db, HttpContext httpContext, IYtdlpService ytdlpService) =>
        {
            var userId = httpContext.GetUserId();
            var video = await db.Videos.FirstOrDefaultAsync(v => v.Id == id && v.UserId == userId);
            if (video is null)
                return Results.NotFound(new { error = new { code = "VIDEO_NOT_FOUND", message = $"Video '{id}' not found" } });

            // Build YouTube URL from video ID if not stored
            var url = video.YoutubeUrl ?? $"https://www.youtube.com/watch?v={video.Id}";

            var info = await ytdlpService.GetVideoInfoAsync(url);
            if (info is null)
                return Results.BadRequest(new { error = new { code = "FETCH_FAILED", message = "Failed to fetch video info from YouTube" } });

            video.Title = info.Title ?? video.Title;
            video.Uploader = info.Uploader ?? video.Uploader;
            video.Duration = info.Duration ?? video.Duration;
            video.YoutubeUrl ??= url;

            await db.SaveChangesAsync();

            return Results.Ok(new { data = video });
        });

        // POST /api/videos/refresh - Refresh all videos metadata
        group.MapPost("/refresh", async (AppDbContext db, HttpContext httpContext, IYtdlpService ytdlpService) =>
        {
            var userId = httpContext.GetUserId();
            var videos = await db.Videos.Where(v => v.UserId == userId).ToListAsync();
            var updated = 0;
            var failed = 0;

            foreach (var video in videos)
            {
                var url = video.YoutubeUrl ?? $"https://www.youtube.com/watch?v={video.Id}";
                var info = await ytdlpService.GetVideoInfoAsync(url);

                if (info is not null)
                {
                    video.Title = info.Title ?? video.Title;
                    video.Uploader = info.Uploader ?? video.Uploader;
                    video.Duration = info.Duration ?? video.Duration;
                    video.YoutubeUrl ??= url;
                    updated++;
                }
                else
                {
                    failed++;
                }
            }

            await db.SaveChangesAsync();

            return Results.Ok(new { data = new { updated, failed, total = videos.Count } });
        });
    }
}
