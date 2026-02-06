// Video
export interface Video {
  id: string
  title: string
  uploader: string
  duration: number | null
  filepath: string
  thumbnailPath: string | null
  filesize: number | null
  downloadedAt: string
  youtubeUrl: string | null
  publishedAt: string | null
  channelId: string | null
}

// Subscription
export interface Subscription {
  id: string
  channelId: string
  channelName: string
  channelUrl: string
  isActive: boolean
  subscribedAt: string
  lastCheckedAt: string | null
  lastVideoDate: string
  totalDownloaded: number
}

// Download
export type DownloadStatus = 'pending' | 'downloading' | 'completed' | 'failed'

export interface Download {
  id: string
  url: string
  status: number // 0=Pending, 1=Downloading, 2=Completed, 3=Failed
  progress: number
  title: string | null
  uploader: string | null
  error: string | null
  startedAt: string
  completedAt: string | null
  ytdlpId: string | null
  speed: string | null
  eta: string | null
  fragmentIndex: number
  fragmentCount: number
  filesizeBytes: number | null
  durationSeconds: number | null
  avgSpeedBytes: number | null
  quality: string
  concurrentFragments: number
}

// Settings
export interface Settings {
  quality: string
  format: string
  concurrent_fragments: string
  sponsorblock: string
  sponsorblock_action: string
  download_thumbnail: string
}

export interface SubscriptionsSettings {
  enabled: boolean
  autoSubscribe: boolean
  cron: string
}

// Stats
export interface Stats {
  totalVideos: number
  totalSize: number
  totalDuration: number
  channelCount: number
  formattedSize: string
  formattedDuration: string
}

export interface DownloadStats {
  last30Days: {
    total: number
    completed: number
    failed: number
    successRate: number
  }
  averages: {
    speedBytesPerSecond: number
    formattedSpeed: string
    durationSeconds: number
  }
  pending: number
  inProgress: number
}

export interface StorageInfo {
  totalBytes: number
  freeBytes: number
  usedBytes: number
  formattedTotal: string
  formattedFree: string
  formattedUsed: string
  percentUsed: number
}

export interface WebhookConfig {
  enabled: boolean
  requiresToken: boolean
  token: string
  port: string
}

export interface NtfyConfig {
  enabled: boolean
  topic: string
}

// User
export interface User {
  id: string
  username: string
  displayName: string
  role: string
  storageQuotaBytes: number | null
  storageUsedBytes?: number
  createdAt?: string
}

// Channel (derived from videos)
export interface Channel {
  name: string
  videoCount: number
  totalSize: number
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T
}

export interface ApiListResponse<T> {
  data: T[]
  total?: number
}

export interface ApiError {
  error: {
    code: string
    message: string
  }
}
