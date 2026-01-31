import { api } from './client'
import type { Settings, ApiResponse } from '../types'

export async function getSettings(): Promise<Settings> {
  const response = await api.get<ApiResponse<Settings>>('/api/settings')
  return response.data
}

export async function updateSettings(settings: Partial<Settings>): Promise<Settings> {
  const response = await api.put<ApiResponse<Settings>>('/api/settings', settings)
  return response.data
}
