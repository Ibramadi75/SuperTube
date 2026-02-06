import { api } from './client'
import type { User, ApiResponse } from '../types'

interface LoginResponse {
  token: string
  user: User
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await api.post<ApiResponse<LoginResponse>>('/api/auth/login', { username, password })
  return res.data
}

export async function getMe(): Promise<User> {
  const res = await api.get<ApiResponse<User>>('/api/auth/me')
  return res.data
}

export async function getUsers(): Promise<User[]> {
  const res = await api.get<ApiResponse<User[]>>('/api/auth/users')
  return res.data
}

export async function createUser(data: {
  username: string
  password: string
  displayName?: string
  role?: string
  storageQuotaBytes?: number | null
}): Promise<User> {
  const res = await api.post<ApiResponse<User>>('/api/auth/users', data)
  return res.data
}

export async function updateUser(
  id: string,
  data: { displayName?: string; role?: string; storageQuotaBytes?: number | null }
): Promise<User> {
  const res = await api.put<ApiResponse<User>>(`/api/auth/users/${id}`, data)
  return res.data
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/api/auth/users/${id}`)
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.put('/api/auth/password', { currentPassword, newPassword })
}

export async function getMyToken(): Promise<string> {
  const res = await api.get<{ data: { token: string } }>('/api/auth/token')
  return res.data.token
}

export async function resetMyToken(): Promise<string> {
  const res = await api.post<{ data: { token: string } }>('/api/auth/token/reset')
  return res.data.token
}
