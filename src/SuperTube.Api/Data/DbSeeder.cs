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
            ["sponsorblock.categories"] = "sponsor,intro,outro,selfpromo,preview,filler,interaction",
            ["subscription.enabled"] = "true",
            ["subscription.auto_subscribe"] = "true",
            ["subscription.cron"] = "0 * 9-21 * * *"
        };

        var existingKeys = db.Settings.Select(s => s.Key).ToHashSet();

        foreach (var (key, value) in defaultSettings)
        {
            if (!existingKeys.Contains(key))
            {
                db.Settings.Add(new Setting { Key = key, Value = value });
            }
        }
    }

}
