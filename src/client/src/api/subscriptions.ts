import { api } from './client'
import type { Subscription, ApiResponse, ApiListResponse } from '../types'

export async function getSubscriptions(): Promise<{ subscriptions: Subscription[], total: number }> {
  const response = await api.get<ApiListResponse<Subscription> & { total: number }>('/api/subscriptions')
  return { subscriptions: response.data, total: response.total ?? response.data.length }
}

export async function getSubscription(id: string): Promise<Subscription> {
  const response = await api.get<ApiResponse<Subscription>>(`/api/subscriptions/${id}`)
  return response.data
}

export async function createSubscription(channelUrl: string): Promise<Subscription> {
  const response = await api.post<ApiResponse<Subscription>>('/api/subscriptions', { channelUrl })
  return response.data
}

export async function updateSubscription(id: string, isActive: boolean): Promise<Subscription> {
  const response = await api.put<ApiResponse<Subscription>>(`/api/subscriptions/${id}`, { isActive })
  return response.data
}

export async function deleteSubscription(id: string): Promise<void> {
  await api.delete(`/api/subscriptions/${id}`)
}

export async function checkSubscription(id: string): Promise<{ newVideos: number, lastCheckedAt: string }> {
  const response = await api.post<ApiResponse<{ newVideos: number, lastCheckedAt: string }>>(`/api/subscriptions/${id}/check`)
  return response.data
}

export async function checkAllSubscriptions(): Promise<{ newVideos: number, checkedSubscriptions: number }> {
  const response = await api.post<ApiResponse<{ newVideos: number, checkedSubscriptions: number }>>('/api/subscriptions/check-all')
  return response.data
}
