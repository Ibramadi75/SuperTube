import { Modal } from './ui'
import type { Video } from '../types'
import { getStreamUrl } from '../api'

interface VideoPlayerProps {
  video: Video | null
  onClose: () => void
}

export function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  if (!video) return null

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m}m ${s}s`
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return 'N/A'
    const units = ['o', 'Ko', 'Mo', 'Go']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="xl">
      <div className="flex flex-col">
        {/* Video */}
        <div className="bg-black aspect-video">
          <video
            src={getStreamUrl(video.id)}
            controls
            autoPlay
            className="w-full h-full"
          >
            Votre navigateur ne supporte pas la lecture video.
          </video>
        </div>

        {/* Info */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-white">{video.title}</h2>
          <p className="text-[var(--text-secondary)] mt-1">{video.uploader}</p>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-[var(--text-secondary)]">
            <div>
              <span className="text-[var(--text-secondary)]">Duree: </span>
              <span className="text-white">{formatDuration(video.duration)}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Taille: </span>
              <span className="text-white">{formatSize(video.filesize)}</span>
            </div>
            <div>
              <span className="text-[var(--text-secondary)]">Telecharge le: </span>
              <span className="text-white">
                {new Date(video.downloadedAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>

          {video.youtubeUrl && (
            <a
              href={video.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-[var(--accent)] hover:underline"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Voir sur YouTube
            </a>
          )}
        </div>
      </div>
    </Modal>
  )
}
