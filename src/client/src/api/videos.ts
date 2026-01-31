import { api } from './client'
import type { Video, ApiResponse, ApiListResponse } from '../types'

export async function getVideos(limit?: number, offset?: number): Promise<{ videos: Video[], total: number }> {
  const params = new URLSearchParams()
  if (limit) params.set('limit', limit.toString())
  if (offset) params.set('offset', offset.toString())
  const query = params.toString() ? `?${params}` : ''
  const response = await api.get<ApiListResponse<Video> & { total: number }>(`/api/videos${query}`)
  return { videos: response.data, total: response.total ?? response.data.length }
}

export async function getVideo(id: string): Promise<Video> {
  const response = await api.get<ApiResponse<Video>>(`/api/videos/${id}`)
  return response.data
}

export async function deleteVideo(id: string): Promise<void> {
  await api.delete(`/api/videos/${id}`)
}

export async function refreshVideo(id: string): Promise<Video> {
  const response = await api.post<ApiResponse<Video>>(`/api/videos/${id}/refresh`)
  return response.data
}

export async function refreshAllVideos(): Promise<{ updated: number; failed: number; total: number }> {
  const response = await api.post<ApiResponse<{ updated: number; failed: number; total: number }>>('/api/videos/refresh')
  return response.data
}

export function getStreamUrl(id: string): string {
  return api.getStreamUrl(id)
}

export function getThumbnailUrl(id: string): string {
  return api.getThumbnailUrl(id)
}
