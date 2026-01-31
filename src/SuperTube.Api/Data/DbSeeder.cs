namespace SuperTube.Api.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        SeedSettings(db);

        // Only seed test videos in Development
        if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
        {
            SeedTestVideos(db);
        }

        db.SaveChanges();
    }

    private static void SeedSettings(AppDbContext db)
    {
        if (db.Settings.Any()) return;

        var defaultSettings = new Dictionary<string, string>
        {
            ["quality.default"] = "1080p",
            ["format.video"] = "mp4",
            ["format.audio"] = "mp3",
            ["format.thumbnail"] = "true",
            ["format.embedThumbnail"] = "true",
            ["performance.concurrentFragments"] = "4",
            ["performance.rateLimit"] = "0",
            ["performance.retries"] = "3",
            ["sponsorblock.enabled"] = "true",
            ["sponsorblock.action"] = "mark",
            ["sponsorblock.categories"] = "sponsor,intro,outro,selfpromo,preview,filler,interaction"
        };

        foreach (var (key, value) in defaultSettings)
        {
            db.Settings.Add(new Setting { Key = key, Value = value });
        }
    }

    private static void SeedTestVideos(AppDbContext db)
    {
        if (db.Videos.Any()) return;

        var testVideos = new[]
        {
            new Video
            {
                Id = "dQw4w9WgXcQ",
                Title = "Rick Astley - Never Gonna Give You Up",
                Uploader = "Rick Astley",
                Duration = 212,
                Filepath = "/youtube/Rick Astley - Never Gonna Give You Up [dQw4w9WgXcQ].mp4",
                ThumbnailPath = "/youtube/Rick Astley - Never Gonna Give You Up [dQw4w9WgXcQ].jpg",
                Filesize = 45_000_000,
                DownloadedAt = DateTime.UtcNow.AddDays(-5),
                YoutubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            new Video
            {
                Id = "jNQXAC9IVRw",
                Title = "Me at the zoo",
                Uploader = "jawed",
                Duration = 19,
                Filepath = "/youtube/jawed - Me at the zoo [jNQXAC9IVRw].mp4",
                ThumbnailPath = "/youtube/jawed - Me at the zoo [jNQXAC9IVRw].jpg",
                Filesize = 2_500_000,
                DownloadedAt = DateTime.UtcNow.AddDays(-3),
                YoutubeUrl = "https://www.youtube.com/watch?v=jNQXAC9IVRw"
            },
            new Video
            {
                Id = "9bZkp7q19f0",
                Title = "PSY - GANGNAM STYLE",
                Uploader = "officialpsy",
                Duration = 253,
                Filepath = "/youtube/officialpsy - PSY - GANGNAM STYLE [9bZkp7q19f0].mp4",
                ThumbnailPath = "/youtube/officialpsy - PSY - GANGNAM STYLE [9bZkp7q19f0].jpg",
                Filesize = 85_000_000,
                DownloadedAt = DateTime.UtcNow.AddDays(-1),
                YoutubeUrl = "https://www.youtube.com/watch?v=9bZkp7q19f0"
            }
        };

        db.Videos.AddRange(testVideos);
    }
}
