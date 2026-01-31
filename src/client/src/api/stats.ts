import { api } from './client'
import type { Stats, DownloadStats, StorageInfo, ApiResponse } from '../types'

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
