import { api } from './client'
import type { Channel, Video, ApiListResponse, ApiResponse } from '../types'

export async function getChannels(): Promise<Channel[]> {
  const response = await api.get<ApiListResponse<Channel>>('/api/channels')
  return response.data
}

export async function getChannelVideos(name: string): Promise<Video[]> {
  const response = await api.get<ApiListResponse<Video>>(`/api/channels/${encodeURIComponent(name)}`)
  return response.data
}

export async function deleteChannel(name: string): Promise<void> {
  await api.delete(`/api/channels/${encodeURIComponent(name)}`)
}

export async function refreshChannel(name: string): Promise<{ updated: number; failed: number; total: number }> {
  const response = await api.post<ApiResponse<{ updated: number; failed: number; total: number }>>(`/api/channels/${encodeURIComponent(name)}/refresh`)
  return response.data
}
