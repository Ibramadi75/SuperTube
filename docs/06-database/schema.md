# Schema SQLite

## Entites EF Core

### Video

```csharp
public class Video
{
    public string Id { get; set; } = null!;          // ID YouTube
    public string Title { get; set; } = null!;
    public string Uploader { get; set; } = null!;
    public int? Duration { get; set; }               // Secondes
    public string Filepath { get; set; } = null!;
    public string? ThumbnailPath { get; set; }
    public long? Filesize { get; set; }              // Bytes
    public DateTime DownloadedAt { get; set; }
    public string? YoutubeUrl { get; set; }
}
```

### Download

```csharp
public class Download
{
    public string Id { get; set; } = null!;
    public string Url { get; set; } = null!;
    public DownloadStatus Status { get; set; }       // Enum
    public int Progress { get; set; }                // 0-100
    public string? Title { get; set; }
    public string? Uploader { get; set; }
    public string? Error { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Metriques
    public long? FilesizeBytes { get; set; }
    public int? DurationSeconds { get; set; }
    public long? AvgSpeedBytes { get; set; }
    public int? FragmentsTotal { get; set; }
    public int? FragmentsDownloaded { get; set; }
    public string? Quality { get; set; }
    public int? ConcurrentFragments { get; set; }
}

public enum DownloadStatus
{
    Pending,
    Downloading,
    Completed,
    Failed
}
```

### Setting

```csharp
public class Setting
{
    public string Key { get; set; } = null!;
    public string Value { get; set; } = null!;
}
```

## DbContext

```csharp
public class AppDbContext : DbContext
{
    public DbSet<Video> Videos => Set<Video>();
    public DbSet<Download> Downloads => Set<Download>();
    public DbSet<Setting> Settings => Set<Setting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Video>(e =>
        {
            e.HasKey(v => v.Id);
            e.HasIndex(v => v.Uploader);
            e.HasIndex(v => v.DownloadedAt).IsDescending();
        });

        modelBuilder.Entity<Download>(e =>
        {
            e.HasKey(d => d.Id);
            e.HasIndex(d => d.Status);
        });

        modelBuilder.Entity<Setting>()
            .HasKey(s => s.Key);
    }
}
```

## SQL Genere

Pour reference, voici le schema SQL equivalent :

```sql
CREATE TABLE videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    uploader TEXT NOT NULL,
    duration INTEGER,
    filepath TEXT NOT NULL,
    thumbnail_path TEXT,
    filesize INTEGER,
    downloaded_at TEXT NOT NULL,
    youtube_url TEXT
);

CREATE TABLE downloads (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    status INTEGER NOT NULL,
    progress INTEGER NOT NULL,
    title TEXT,
    uploader TEXT,
    error TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    filesize_bytes INTEGER,
    duration_seconds INTEGER,
    avg_speed_bytes INTEGER,
    fragments_total INTEGER,
    fragments_downloaded INTEGER,
    quality TEXT,
    concurrent_fragments INTEGER
);

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX idx_videos_uploader ON videos(uploader);
CREATE INDEX idx_videos_downloaded_at ON videos(downloaded_at DESC);
CREATE INDEX idx_downloads_status ON downloads(status);
```

---

[Retour a la Database](./README.md)
