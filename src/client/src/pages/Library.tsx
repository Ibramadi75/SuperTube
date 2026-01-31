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
  } = useStore()

  const [filteredVideos, setFilteredVideos] = useState<Video[]>([])

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

  const handleDeleteChannel = () => {
    if (channel && confirm(`Supprimer toutes les videos de "${channel}" ?`)) {
      deleteChannel(channel)
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
            <h1 className="text-2xl font-bold text-white">
              {channel || 'Bibliotheque'}
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              {filteredVideos.length} video{filteredVideos.length !== 1 ? 's' : ''}
            </p>
          </div>
          {channel && (
            <Button variant="danger" onClick={handleDeleteChannel}>
              Supprimer la chaine
            </Button>
          )}
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
