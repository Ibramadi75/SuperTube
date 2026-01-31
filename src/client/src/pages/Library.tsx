import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useStore } from '../store'
import { VideoCard, VideoPlayer, Button } from '../components'
import type { Video } from '../types'

export function Library() {
  const { channel } = useParams<{ channel?: string }>()
  const {
    videos,
    fetchVideos,
    videosLoading,
    channels,
    fetchChannels,
    selectedVideo,
    setSelectedVideo,
    deleteVideo,
    deleteChannel,
    refreshVideo,
    selectedVideoIds,
    toggleVideoSelection,
    selectAllVideos,
    clearSelection,
    deleteSelectedVideos,
    refreshSelectedVideos,
  } = useStore()

  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const selectionMode = selectedVideoIds.size > 0

  useEffect(() => {
    fetchVideos()
    fetchChannels()
  }, [fetchVideos, fetchChannels])

  useEffect(() => {
    if (channel) {
      setFilteredVideos(videos.filter((v) => v.uploader === channel))
    } else {
      setFilteredVideos(videos)
    }
  }, [videos, channel])

  // Clear selection when changing channel
  useEffect(() => {
    clearSelection()
  }, [channel, clearSelection])

  const handleDeleteChannel = () => {
    if (channel && confirm(`Supprimer toutes les videos de "${channel}" ?`)) {
      deleteChannel(channel)
    }
  }

  const handleRefreshSelected = async () => {
    setRefreshing(true)
    try {
      await refreshSelectedVideos()
    } finally {
      setRefreshing(false)
    }
  }

  const handleDeleteSelected = async () => {
    const count = selectedVideoIds.size
    if (confirm(`Supprimer ${count} video${count > 1 ? 's' : ''} ?`)) {
      setDeleting(true)
      try {
        await deleteSelectedVideos()
      } finally {
        setDeleting(false)
      }
    }
  }

  const handleSelectAll = () => {
    if (selectedVideoIds.size === filteredVideos.length) {
      clearSelection()
    } else {
      selectAllVideos(filteredVideos.map((v) => v.id))
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar - Channels */}
      <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--bg-tertiary)] overflow-y-auto hidden md:block">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            Chaines
          </h2>
          <nav className="space-y-1">
            <Link
              to="/library"
              className={`block px-3 py-2 rounded-lg transition-colors ${
                !channel
                  ? 'bg-[var(--bg-tertiary)] text-white'
                  : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              Toutes les videos ({videos.length})
            </Link>
            {channels.map((ch) => (
              <Link
                key={ch.name}
                to={`/library/${encodeURIComponent(ch.name)}`}
                className={`block px-3 py-2 rounded-lg transition-colors ${
                  channel === ch.name
                    ? 'bg-[var(--bg-tertiary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <span className="truncate">{ch.name}</span>
                <span className="text-xs ml-2 text-[var(--text-secondary)]">
                  ({ch.videoCount})
                </span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            {selectionMode ? (
              <>
                <h1 className="text-2xl font-bold text-white">
                  {selectedVideoIds.size} selectionnee{selectedVideoIds.size > 1 ? 's' : ''}
                </h1>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-[var(--accent)] hover:underline mt-1"
                >
                  {selectedVideoIds.size === filteredVideos.length ? 'Tout deselectionner' : 'Tout selectionner'}
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-white">
                  {channel || 'Bibliotheque'}
                </h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                {/* Refresh button */}
                <button
                  onClick={handleRefreshSelected}
                  disabled={refreshing}
                  className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-white disabled:opacity-50 transition-colors"
                  title="Rafraichir les metadonnees"
                >
                  {refreshing ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
                {/* Delete button */}
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-500 disabled:opacity-50 transition-colors"
                  title="Supprimer"
                >
                  {deleting ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
                {/* Cancel button */}
                <button
                  onClick={clearSelection}
                  className="p-2 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors"
                  title="Annuler"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              channel && (
                <Button variant="danger" onClick={handleDeleteChannel}>
                  Supprimer la chaine
                </Button>
              )
            )}
          </div>
        </div>

        {/* Mobile channel selector */}
        <div className="md:hidden mb-6">
          <select
            value={channel || ''}
            onChange={(e) => {
              if (e.target.value) {
                window.location.href = `/library/${encodeURIComponent(e.target.value)}`
              } else {
                window.location.href = '/library'
              }
            }}
            className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--bg-tertiary)] rounded-lg text-white"
          >
            <option value="">Toutes les chaines</option>
            {channels.map((ch) => (
              <option key={ch.name} value={ch.name}>
                {ch.name} ({ch.videoCount})
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {videosLoading && videos.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {/* Video grid */}
        {filteredVideos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => setSelectedVideo(video)}
                onDelete={() => {
                  if (confirm(`Supprimer "${video.title}" ?`)) {
                    deleteVideo(video.id)
                  }
                }}
                onRefresh={() => refreshVideo(video.id)}
                onSelect={() => toggleVideoSelection(video.id)}
                isSelected={selectedVideoIds.has(video.id)}
                selectionMode={selectionMode}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!videosLoading && filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-[var(--text-secondary)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <h3 className="text-lg font-medium text-white mb-2">
              {channel ? `Aucune video de ${channel}` : 'Bibliotheque vide'}
            </h3>
            <p className="text-[var(--text-secondary)]">
              <Link to="/" className="text-[var(--accent)] hover:underline">
                Telecharger une video
              </Link>
              {' '}pour commencer
            </p>
          </div>
        )}
      </main>

      {/* Video Player Modal */}
      <VideoPlayer
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  )
}
