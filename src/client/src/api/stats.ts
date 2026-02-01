import { api } from './client'
import type { Stats, DownloadStats, StorageInfo, WebhookConfig, ApiResponse } from '../types'

export async function getStats(): Promise<Stats> {
  const response = await api.get<ApiResponse<Stats>>('/api/stats')
  return response.data
}

export async function getDownloadStats(): Promise<DownloadStats> {
  const response = await api.get<ApiResponse<DownloadStats>>('/api/stats/downloads')
  return response.data
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const response = await api.get<ApiResponse<StorageInfo>>('/api/storage')
  return response.data
}

export async function getWebhookConfig(): Promise<WebhookConfig> {
  const response = await api.get<ApiResponse<WebhookConfig>>('/api/webhook')
  return response.data
}

export async function updateWebhookConfig(requireToken: boolean): Promise<WebhookConfig> {
  const response = await api.put<ApiResponse<WebhookConfig>>('/api/webhook', { requireToken })
  return response.data
}

export async function regenerateWebhookToken(): Promise<{ token: string }> {
  const response = await api.post<ApiResponse<{ token: string }>>('/api/webhook/regenerate', {})
  return response.data
}
