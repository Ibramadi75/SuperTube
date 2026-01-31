namespace SuperTube.Api.Data;

public class Video
{
    public string Id { get; set; } = null!;
    public string Title { get; set; } = null!;
    public string Uploader { get; set; } = null!;
    public int? Duration { get; set; }
    public string Filepath { get; set; } = null!;
    public string? ThumbnailPath { get; set; }
    public long? Filesize { get; set; }
    public DateTime DownloadedAt { get; set; }
    public string? YoutubeUrl { get; set; }
}

public class Download
{
    public string Id { get; set; } = null!;
    public string Url { get; set; } = null!;
    public DownloadStatus Status { get; set; }
    public int Progress { get; set; }
    public string? Title { get; set; }
    public string? Uploader { get; set; }
    public string? Error { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    // Metrics
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

public class Setting
{
    public string Key { get; set; } = null!;
    public string Value { get; set; } = null!;
}
