import { useState, useRef, useEffect } from 'react'
import type { Video } from '../types'
import { getThumbnailUrl } from '../api'

interface VideoCardProps {
  video: Video
  onClick: () => void
  onDelete?: () => void
  onRefresh?: () => void
  onSelect?: () => void
  isSelected?: boolean
  selectionMode?: boolean
}

export function VideoCard({ video, onClick, onDelete, onRefresh, onSelect, isSelected, selectionMode }: VideoCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return ''
    const units = ['o', 'Ko', 'Mo', 'Go']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const handleCardClick = () => {
    if (selectionMode && onSelect) {
      onSelect()
    } else {
      onClick()
    }
  }

  return (
    <div className={`group relative bg-[var(--bg-secondary)] rounded-lg overflow-hidden hover:bg-[var(--bg-tertiary)] transition-colors ${isSelected ? 'ring-2 ring-[var(--accent)]' : ''}`}>
      {/* Three-dot menu */}
      {!selectionMode && onSelect && (
        <div className="absolute top-2 right-2 z-10" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-opacity"
          >
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 bg-[var(--bg-tertiary)] border border-[var(--bg-secondary)] rounded-lg shadow-lg py-1 min-w-[140px]">
              {onRefresh && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onRefresh()
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[var(--bg-secondary)] flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Rafraichir
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuOpen(false)
                    onDelete()
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-[var(--bg-secondary)] flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                  onSelect()
                }}
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[var(--bg-secondary)] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Selectionner
              </button>
            </div>
          )}
        </div>
      )}

      {/* Selection checkbox */}
      {selectionMode && (
        <div className="absolute top-2 left-2 z-10">
          <div
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.()
            }}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
              isSelected
                ? 'bg-[var(--accent)] border-[var(--accent)]'
                : 'bg-black/40 border-white/60 hover:border-white'
            }`}
          >
            {isSelected && (
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div
        className="relative aspect-video bg-[var(--bg-tertiary)] cursor-pointer"
        onClick={handleCardClick}
      >
        {video.thumbnailPath && (
          <img
            src={getThumbnailUrl(video.id)}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
        <div className={`w-full h-full flex items-center justify-center text-[var(--text-secondary)] absolute inset-0 ${video.thumbnailPath ? '-z-10' : ''}`}>
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-xs text-white font-medium">
          {formatDuration(video.duration)}
        </div>

        {/* Play overlay - only show when not in selection mode */}
        {!selectionMode && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3
          className="font-medium text-white line-clamp-2 cursor-pointer hover:text-[var(--accent)]"
          onClick={handleCardClick}
          title={video.title}
        >
          {video.title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{video.uploader}</p>
        <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-secondary)]">
          <span>{formatSize(video.filesize)}</span>
          {!selectionMode && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-400 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
