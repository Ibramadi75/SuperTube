using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SuperTube.Api.Services;

public interface IYtdlpService
{
    Task<YtdlpDownloadResponse> StartDownloadAsync(YtdlpDownloadRequest request);
    Task<YtdlpDownloadStatus?> GetDownloadStatusAsync(string downloadId);
    Task CancelDownloadAsync(string downloadId);
    Task<YtdlpVideoInfo?> GetVideoInfoAsync(string url);
    IAsyncEnumerable<YtdlpProgressEvent> StreamProgressAsync(string downloadId, CancellationToken cancellationToken);
}

public class YtdlpService : IYtdlpService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<YtdlpService> _logger;

    public YtdlpService(HttpClient httpClient, ILogger<YtdlpService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<YtdlpDownloadResponse> StartDownloadAsync(YtdlpDownloadRequest request)
    {
        var response = await _httpClient.PostAsJsonAsync("/download", request);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<YtdlpDownloadResponse>();
        return result ?? throw new InvalidOperationException("Failed to parse download response");
    }

    public async Task<YtdlpDownloadStatus?> GetDownloadStatusAsync(string downloadId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/download/{downloadId}");
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<YtdlpDownloadStatus>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get download status for {DownloadId}", downloadId);
            return null;
        }
    }

    public async Task CancelDownloadAsync(string downloadId)
    {
        var response = await _httpClient.DeleteAsync($"/download/{downloadId}");
        response.EnsureSuccessStatusCode();
    }

    public async Task<YtdlpVideoInfo?> GetVideoInfoAsync(string url)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("/info", new { url });
            if (!response.IsSuccessStatusCode)
                return null;

            return await response.Content.ReadFromJsonAsync<YtdlpVideoInfo>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get video info for {Url}", url);
            return null;
        }
    }

    public async IAsyncEnumerable<YtdlpProgressEvent> StreamProgressAsync(
        string downloadId,
        [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
    {
        using var response = await _httpClient.GetAsync(
            $"/download/{downloadId}/stream",
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);

        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);

        string? eventType = null;
        string? data = null;

        while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            if (line == null) break;

            if (line.StartsWith("event:"))
            {
                eventType = line[6..].Trim();
            }
            else if (line.StartsWith("data:"))
            {
                data = line[5..].Trim();
            }
            else if (string.IsNullOrEmpty(line) && data != null)
            {
                // End of event
                var progressEvent = JsonSerializer.Deserialize<YtdlpProgressEvent>(data);
                if (progressEvent != null)
                {
                    progressEvent.EventType = eventType ?? "progress";
                    yield return progressEvent;

                    if (eventType == "complete")
                        yield break;
                }

                eventType = null;
                data = null;
            }
        }
    }
}

public class YtdlpDownloadRequest
{
    [JsonPropertyName("url")]
    public required string Url { get; set; }

    [JsonPropertyName("quality")]
    public string Quality { get; set; } = "1080";

    [JsonPropertyName("format")]
    public string Format { get; set; } = "mp4";

    [JsonPropertyName("concurrent_fragments")]
    public int ConcurrentFragments { get; set; } = 4;

    [JsonPropertyName("sponsorblock")]
    public bool Sponsorblock { get; set; } = true;

    [JsonPropertyName("sponsorblock_action")]
    public string SponsorblockAction { get; set; } = "mark";

    [JsonPropertyName("download_thumbnail")]
    public bool DownloadThumbnail { get; set; } = true;
}

public class YtdlpDownloadResponse
{
    [JsonPropertyName("id")]
    public required string Id { get; set; }

    [JsonPropertyName("status")]
    public required string Status { get; set; }
}

public class YtdlpDownloadStatus
{
    [JsonPropertyName("id")]
    public required string Id { get; set; }

    [JsonPropertyName("url")]
    public string? Url { get; set; }

    [JsonPropertyName("status")]
    public required string Status { get; set; }

    [JsonPropertyName("percent")]
    public double Percent { get; set; }

    [JsonPropertyName("speed")]
    public string? Speed { get; set; }

    [JsonPropertyName("eta")]
    public string? Eta { get; set; }

    [JsonPropertyName("fragment_index")]
    public int FragmentIndex { get; set; }

    [JsonPropertyName("fragment_count")]
    public int FragmentCount { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }

    [JsonPropertyName("result")]
    public YtdlpDownloadResult? Result { get; set; }

    [JsonPropertyName("created_at")]
    public string? CreatedAt { get; set; }

    [JsonPropertyName("started_at")]
    public string? StartedAt { get; set; }

    [JsonPropertyName("completed_at")]
    public string? CompletedAt { get; set; }
}

public class YtdlpDownloadResult
{
    [JsonPropertyName("filepath")]
    public string? Filepath { get; set; }

    [JsonPropertyName("uploader")]
    public string? Uploader { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("video_id")]
    public string? VideoId { get; set; }

    [JsonPropertyName("ext")]
    public string? Ext { get; set; }
}

public class YtdlpProgressEvent
{
    [JsonIgnore]
    public string EventType { get; set; } = "progress";

    [JsonPropertyName("id")]
    public required string Id { get; set; }

    [JsonPropertyName("status")]
    public required string Status { get; set; }

    [JsonPropertyName("percent")]
    public double Percent { get; set; }

    [JsonPropertyName("speed")]
    public string? Speed { get; set; }

    [JsonPropertyName("eta")]
    public string? Eta { get; set; }

    [JsonPropertyName("fragment_index")]
    public int FragmentIndex { get; set; }

    [JsonPropertyName("fragment_count")]
    public int FragmentCount { get; set; }
}

public class YtdlpVideoInfo
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("uploader")]
    public string? Uploader { get; set; }

    [JsonPropertyName("duration")]
    public int? Duration { get; set; }

    [JsonPropertyName("thumbnail")]
    public string? Thumbnail { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }

    [JsonPropertyName("upload_date")]
    public string? UploadDate { get; set; }
}
