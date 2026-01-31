import { create } from 'zustand'
import type { Video, Download, Settings, Stats, StorageInfo, Channel } from '../types'
import * as api from '../api'

interface AppState {
  // Videos
  videos: Video[]
  videosLoading: boolean
  videosError: string | null
  fetchVideos: () => Promise<void>
  deleteVideo: (id: string) => Promise<void>

  // Channels
  channels: Channel[]
  channelsLoading: boolean
  fetchChannels: () => Promise<void>
  deleteChannel: (name: string) => Promise<void>

  // Downloads
  downloads: Download[]
  downloadsLoading: boolean
  fetchDownloads: () => Promise<void>
  startDownload: (url: string, quality?: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  updateDownload: (id: string, update: Partial<Download>) => void

  // Settings
  settings: Settings | null
  settingsLoading: boolean
  fetchSettings: () => Promise<void>
  updateSettings: (settings: Partial<Settings>) => Promise<void>

  // Stats
  stats: Stats | null
  storage: StorageInfo | null
  statsLoading: boolean
  fetchStats: () => Promise<void>
  fetchStorage: () => Promise<void>

  // UI
  selectedVideo: Video | null
  setSelectedVideo: (video: Video | null) => void
  toasts: Toast[]
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export const useStore = create<AppState>((set, get) => ({
  // Videos
  videos: [],
  videosLoading: false,
  videosError: null,

  fetchVideos: async () => {
    set({ videosLoading: true, videosError: null })
    try {
      const { videos } = await api.getVideos()
      set({ videos, videosLoading: false })
    } catch (error) {
      set({ videosError: (error as Error).message, videosLoading: false })
    }
  },

  deleteVideo: async (id: string) => {
    try {
      await api.deleteVideo(id)
      set({ videos: get().videos.filter((v) => v.id !== id) })
      get().addToast('Video supprimee', 'success')
      get().fetchChannels() // Refresh channels
    } catch (error) {
      get().addToast((error as Error).message, 'error')
    }
  },

  // Channels
  channels: [],
  channelsLoading: false,

  fetchChannels: async () => {
    set({ channelsLoading: true })
    try {
      const channels = await api.getChannels()
      set({ channels, channelsLoading: false })
    } catch {
      set({ channelsLoading: false })
    }
  },

  deleteChannel: async (name: string) => {
    try {
      await api.deleteChannel(name)
      get().addToast(`Chaine "${name}" supprimee`, 'success')
      get().fetchVideos()
      get().fetchChannels()
    } catch (error) {
      get().addToast((error as Error).message, 'error')
    }
  },

  // Downloads
  downloads: [],
  downloadsLoading: false,

  fetchDownloads: async () => {
    set({ downloadsLoading: true })
    try {
      const downloads = await api.getDownloads()
      set({ downloads, downloadsLoading: false })
    } catch {
      set({ downloadsLoading: false })
    }
  },

  startDownload: async (url: string, quality?: string) => {
    try {
      const download = await api.startDownload({ url, quality })
      set({ downloads: [download, ...get().downloads] })
      get().addToast('Telechargement demarre', 'success')

      // Subscribe to progress
      const unsubscribe = api.subscribeToProgress(download.id, (data) => {
        const sseData = data as { status: string; progress: number; speed?: string; eta?: string; fragmentIndex?: number; fragmentCount?: number }

        // Convert string status to number for store compatibility
        const statusMap: Record<string, number> = {
          pending: 0,
          downloading: 1,
          completed: 2,
          failed: 3,
        }

        const update: Partial<Download> = {
          ...sseData,
          status: statusMap[sseData.status] ?? 1,
        }

        get().updateDownload(download.id, update)

        // Check if completed
        if (sseData.status === 'completed') {
          unsubscribe()
          get().fetchVideos()
          get().fetchStats()
          get().addToast('Telechargement termine', 'success')
        } else if (sseData.status === 'failed') {
          unsubscribe()
          get().addToast('Telechargement echoue', 'error')
        }
      })
    } catch (error) {
      get().addToast((error as Error).message, 'error')
    }
  },

  cancelDownload: async (id: string) => {
    try {
      await api.cancelDownload(id)
      get().fetchDownloads()
      get().addToast('Telechargement annule', 'info')
    } catch (error) {
      get().addToast((error as Error).message, 'error')
    }
  },

  updateDownload: (id: string, update: Partial<Download>) => {
    set({
      downloads: get().downloads.map((d) =>
        d.id === id ? { ...d, ...update } : d
      ),
    })
  },

  // Settings
  settings: null,
  settingsLoading: false,

  fetchSettings: async () => {
    set({ settingsLoading: true })
    try {
      const settings = await api.getSettings()
      set({ settings, settingsLoading: false })
    } catch {
      set({ settingsLoading: false })
    }
  },

  updateSettings: async (settings: Partial<Settings>) => {
    try {
      const updated = await api.updateSettings(settings)
      set({ settings: updated })
      get().addToast('Parametres sauvegardes', 'success')
    } catch (error) {
      get().addToast((error as Error).message, 'error')
    }
  },

  // Stats
  stats: null,
  storage: null,
  statsLoading: false,

  fetchStats: async () => {
    set({ statsLoading: true })
    try {
      const stats = await api.getStats()
      set({ stats, statsLoading: false })
    } catch {
      set({ statsLoading: false })
    }
  },

  fetchStorage: async () => {
    try {
      const storage = await api.getStorageInfo()
      set({ storage })
    } catch {
      // Ignore
    }
  },

  // UI
  selectedVideo: null,
  setSelectedVideo: (video) => set({ selectedVideo: video }),

  toasts: [],
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).slice(2)
    set({ toasts: [...get().toasts, { id, message, type }] })
    setTimeout(() => get().removeToast(id), 4000)
  },
  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) })
  },
}))
