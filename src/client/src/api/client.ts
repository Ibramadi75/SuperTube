const API_BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'supertube_token'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function handleUnauthorized(response: Response): void {
  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY)
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: getAuthHeaders(),
    })
    handleUnauthorized(response)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Request failed')
    }
    return response.json()
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const options: RequestInit = {
      method: 'POST',
      headers: { ...getAuthHeaders() },
    }
    if (body !== undefined) {
      ;(options.headers as Record<string, string>)['Content-Type'] = 'application/json'
      options.body = JSON.stringify(body)
    }
    const response = await fetch(`${this.baseUrl}${path}`, options)
    handleUnauthorized(response)
    if (!response.ok) {
      const text = await response.text()
      const error = text ? JSON.parse(text) : { error: { message: 'Request failed' } }
      throw new Error(error.error?.message || 'Request failed')
    }
    const text = await response.text()
    return text ? JSON.parse(text) : ({} as T)
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    handleUnauthorized(response)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Request failed')
    }
    return response.json()
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    handleUnauthorized(response)
    if (!response.ok) {
      const text = await response.text()
      const error = text ? JSON.parse(text) : { error: { message: 'Request failed' } }
      throw new Error(error.error?.message || 'Request failed')
    }
    const text = await response.text()
    return text ? JSON.parse(text) : ({} as T)
  }

  getStreamUrl(videoId: string): string {
    const token = getToken()
    const base = `${this.baseUrl}/api/videos/${videoId}/stream`
    return token ? `${base}?token=${encodeURIComponent(token)}` : base
  }

  getThumbnailUrl(videoId: string): string {
    const token = getToken()
    const base = `${this.baseUrl}/api/videos/${videoId}/thumbnail`
    return token ? `${base}?token=${encodeURIComponent(token)}` : base
  }

  subscribeToProgress(downloadId: string, onMessage: (data: unknown) => void): () => void {
    const token = getToken()
    const url = token
      ? `${this.baseUrl}/api/downloads/${downloadId}/progress?token=${encodeURIComponent(token)}`
      : `${this.baseUrl}/api/downloads/${downloadId}/progress`
    const eventSource = new EventSource(url)

    eventSource.addEventListener('progress', (e) => {
      onMessage(JSON.parse(e.data))
    })

    eventSource.addEventListener('complete', (e) => {
      onMessage(JSON.parse(e.data))
      eventSource.close()
    })

    eventSource.onerror = () => {
      eventSource.close()
    }

    return () => eventSource.close()
  }
}

export const api = new ApiClient(API_BASE)
