const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Request failed')
    }
    return response.json()
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const options: RequestInit = {
      method: 'POST',
    }
    if (body !== undefined) {
      options.headers = { 'Content-Type': 'application/json' }
      options.body = JSON.stringify(body)
    }
    const response = await fetch(`${this.baseUrl}${path}`, options)
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Request failed')
    }
    return response.json()
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      const text = await response.text()
      const error = text ? JSON.parse(text) : { error: { message: 'Request failed' } }
      throw new Error(error.error?.message || 'Request failed')
    }
    const text = await response.text()
    return text ? JSON.parse(text) : ({} as T)
  }

  getStreamUrl(videoId: string): string {
    return `${this.baseUrl}/api/videos/${videoId}/stream`
  }

  getThumbnailUrl(videoId: string): string {
    return `${this.baseUrl}/api/videos/${videoId}/thumbnail`
  }

  subscribeToProgress(downloadId: string, onMessage: (data: unknown) => void): () => void {
    const eventSource = new EventSource(`${this.baseUrl}/api/downloads/${downloadId}/progress`)

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
