import { useState } from 'react'
import { Button, Input, Select } from './ui'
import { useStore } from '../store'

interface DownloadFormProps {
  compact?: boolean
}

const YOUTUBE_URL_PATTERN = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)[\w-]+/

export function DownloadForm({ compact = false }: DownloadFormProps) {
  const [url, setUrl] = useState('')
  const [quality, setQuality] = useState('1080')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const startDownload = useStore((state) => state.startDownload)

  const isValidUrl = YOUTUBE_URL_PATTERN.test(url)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValidUrl) {
      setError('URL YouTube invalide')
      return
    }

    setLoading(true)
    setError('')
    try {
      await startDownload(url, quality)
      setUrl('')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="url"
          placeholder="Coller l'URL YouTube..."
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            setError('')
          }}
          className="flex-1"
        />
        <Button type="submit" disabled={!url || loading} loading={loading}>
          Telecharger
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="URL YouTube"
        type="url"
        placeholder="https://www.youtube.com/watch?v=..."
        value={url}
        onChange={(e) => {
          setUrl(e.target.value)
          setError('')
        }}
        error={error}
      />

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Select
            label="Qualite"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            options={[
              { value: '2160', label: '4K (2160p)' },
              { value: '1080', label: 'Full HD (1080p)' },
              { value: '720', label: 'HD (720p)' },
              { value: '480', label: 'SD (480p)' },
              { value: 'audio', label: 'Audio uniquement' },
            ]}
          />
        </div>

        <Button
          type="submit"
          disabled={!url || loading}
          loading={loading}
          size="lg"
        >
          {loading ? 'Demarrage...' : 'Telecharger'}
        </Button>
      </div>

      {url && !isValidUrl && (
        <p className="text-sm text-amber-500">
          Formats acceptes: youtube.com/watch, youtube.com/shorts, youtu.be
        </p>
      )}
    </form>
  )
}
