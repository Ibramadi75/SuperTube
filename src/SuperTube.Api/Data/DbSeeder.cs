namespace SuperTube.Api.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        SeedSettings(db);
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

}
