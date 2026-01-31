import { ProgressBar, Button } from './ui'
import type { Download } from '../types'
import { useStore } from '../store'

interface DownloadProgressProps {
  download: Download
}

const STATUS_LABELS: Record<number, string> = {
  0: 'En attente',
  1: 'Telechargement',
  2: 'Termine',
  3: 'Echoue',
}

const STATUS_COLORS: Record<number, string> = {
  0: 'text-amber-500',
  1: 'text-blue-500',
  2: 'text-green-500',
  3: 'text-red-500',
}

export function DownloadProgress({ download }: DownloadProgressProps) {
  const cancelDownload = useStore((state) => state.cancelDownload)

  const isActive = download.status === 0 || download.status === 1

  return (
    <div className="bg-[var(--bg-tertiary)] rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title or URL */}
          <p className="font-medium text-white truncate">
            {download.title || download.url}
          </p>

          {/* Uploader */}
          {download.uploader && (
            <p className="text-sm text-[var(--text-secondary)]">{download.uploader}</p>
          )}

          {/* Status */}
          <p className={`text-sm mt-1 ${STATUS_COLORS[download.status]}`}>
            {STATUS_LABELS[download.status]}
            {download.error && ` - ${download.error}`}
          </p>
        </div>

        {/* Cancel button */}
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => cancelDownload(download.id)}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {download.status === 1 && (
        <div className="mt-3">
          <ProgressBar value={download.progress} size="md" />

          {/* Stats */}
          <div className="flex items-center justify-between mt-2 text-xs text-[var(--text-secondary)]">
            <span>{download.progress}%</span>
            <div className="flex items-center gap-3">
              {download.speed && <span>{download.speed}</span>}
              {download.eta && download.eta !== 'NA' && <span>ETA: {download.eta}</span>}
              {download.fragmentCount > 0 && (
                <span>
                  {download.fragmentIndex}/{download.fragmentCount} fragments
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completed stats */}
      {download.status === 2 && download.durationSeconds && (
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          Telecharge en {download.durationSeconds}s
          {download.avgSpeedBytes && ` - Vitesse moyenne: ${formatSpeed(download.avgSpeedBytes)}`}
        </p>
      )}
    </div>
  )
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond >= 1024 * 1024) {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} Mo/s`
  }
  if (bytesPerSecond >= 1024) {
    return `${(bytesPerSecond / 1024).toFixed(0)} Ko/s`
  }
  return `${bytesPerSecond} o/s`
}
