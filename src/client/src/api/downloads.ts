import { api } from './client'
import type { Download, ApiResponse, ApiListResponse } from '../types'

export interface StartDownloadRequest {
  url: string
  quality?: string
  concurrentFragments?: number
}

export async function getDownloads(status?: string): Promise<Download[]> {
  const query = status ? `?status=${status}` : ''
  const response = await api.get<ApiListResponse<Download>>(`/api/downloads${query}`)
  return response.data
}

export async function getDownload(id: string): Promise<Download> {
  const response = await api.get<ApiResponse<Download>>(`/api/downloads/${id}`)
  return response.data
}

export async function startDownload(request: StartDownloadRequest): Promise<Download> {
  const response = await api.post<ApiResponse<Download>>('/api/downloads', request)
  return response.data
}

export async function cancelDownload(id: string): Promise<Download> {
  const response = await api.delete<ApiResponse<Download>>(`/api/downloads/${id}`)
  return response.data
}

export function subscribeToProgress(downloadId: string, onMessage: (data: unknown) => void): () => void {
  return api.subscribeToProgress(downloadId, onMessage)
}
