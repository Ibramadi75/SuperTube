import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Button, Select, Toggle } from '../components'
import { getWebhookConfig } from '../api'
import type { WebhookConfig } from '../types'

export function Settings() {
  const {
    settings,
    settingsLoading,
    fetchSettings,
    updateSettings,
    storage,
    fetchStorage,
  } = useStore()

  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)

  const [localSettings, setLocalSettings] = useState({
    quality: '1080',
    format: 'mp4',
    concurrent_fragments: '4',
    sponsorblock: 'true',
    sponsorblock_action: 'mark',
    download_thumbnail: 'true',
  })

  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchStorage()
    getWebhookConfig().then(setWebhookConfig).catch(() => {})
  }, [fetchSettings, fetchStorage])

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  const handleChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    await updateSettings(localSettings)
    setHasChanges(false)
  }

  if (settingsLoading && !settings) {
    return (
      <div className="p-6 flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Parametres</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Configuration des telechargements
        </p>
      </div>

      {/* Quality */}
      <section className="bg-[var(--bg-secondary)] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Qualite video</h2>
        <Select
          label="Resolution maximale"
          value={localSettings.quality}
          onChange={(e) => handleChange('quality', e.target.value)}
          options={[
            { value: '2160', label: '4K (2160p)' },
            { value: '1080', label: 'Full HD (1080p) - Recommande' },
            { value: '720', label: 'HD (720p)' },
            { value: '480', label: 'SD (480p)' },
            { value: 'audio', label: 'Audio uniquement (MP3)' },
          ]}
        />
        <p className="text-sm text-[var(--text-secondary)]">
          La meilleure qualite disponible jusqu'a cette resolution sera telechargee.
        </p>
      </section>

      {/* Format */}
      <section className="bg-[var(--bg-secondary)] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Format</h2>
        <Select
          label="Format de sortie"
          value={localSettings.format}
          onChange={(e) => handleChange('format', e.target.value)}
          options={[
            { value: 'mp4', label: 'MP4 - Compatible partout' },
            { value: 'mkv', label: 'MKV - Meilleure qualite' },
            { value: 'webm', label: 'WebM - Format ouvert' },
          ]}
        />
        <Toggle
          label="Telecharger les miniatures"
          description="Enregistrer l'image de couverture avec la video"
          checked={localSettings.download_thumbnail === 'true'}
          onChange={(checked) => handleChange('download_thumbnail', checked.toString())}
        />
      </section>

      {/* Performance */}
      <section className="bg-[var(--bg-secondary)] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Performance</h2>
        <Select
          label="Fragments simultanes"
          value={localSettings.concurrent_fragments}
          onChange={(e) => handleChange('concurrent_fragments', e.target.value)}
          options={[
            { value: '1', label: '1 - Lent mais stable' },
            { value: '2', label: '2' },
            { value: '4', label: '4 - Equilibre (Recommande)' },
            { value: '8', label: '8 - Rapide' },
            { value: '16', label: '16 - Maximum' },
          ]}
        />
        <p className="text-sm text-[var(--text-secondary)]">
          Plus de fragments = telechargement plus rapide, mais peut surcharger la connexion.
        </p>
      </section>

      {/* SponsorBlock */}
      <section className="bg-[var(--bg-secondary)] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">SponsorBlock</h2>
        <Toggle
          label="Activer SponsorBlock"
          description="Marquer ou supprimer les segments sponsorises"
          checked={localSettings.sponsorblock === 'true'}
          onChange={(checked) => handleChange('sponsorblock', checked.toString())}
        />
        {localSettings.sponsorblock === 'true' && (
          <Select
            label="Action"
            value={localSettings.sponsorblock_action}
            onChange={(e) => handleChange('sponsorblock_action', e.target.value)}
            options={[
              { value: 'mark', label: 'Marquer comme chapitres' },
              { value: 'remove', label: 'Supprimer automatiquement' },
            ]}
          />
        )}
        <p className="text-sm text-[var(--text-secondary)]">
          {localSettings.sponsorblock_action === 'mark'
            ? 'Les segments sponsorises seront visibles comme chapitres dans le lecteur.'
            : 'Les segments sponsorises seront coupes de la video finale.'}
        </p>
      </section>

      {/* Storage (read-only) */}
      {storage && storage.percentUsed > 0 && (
        <section className="bg-[var(--bg-secondary)] rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Stockage</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Utilise</span>
              <span className="text-white">{storage.formattedUsed}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Libre</span>
              <span className="text-white">{storage.formattedFree}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Total</span>
              <span className="text-white">{storage.formattedTotal}</span>
            </div>
            <div className="w-full h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full ${
                  storage.percentUsed > 90
                    ? 'bg-red-500'
                    : storage.percentUsed > 70
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${storage.percentUsed}%` }}
              />
            </div>
            <p className="text-sm text-[var(--text-secondary)] text-center">
              {storage.percentUsed.toFixed(1)}% utilise
            </p>
          </div>
        </section>
      )}

      {/* Webhook */}
      <section className="bg-[var(--bg-secondary)] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Webhook (Raccourcis mobile)</h2>
        {webhookConfig?.enabled ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">URL du webhook</label>
              <div className="flex gap-2">
                <code className="flex-1 bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg text-sm text-[var(--accent)] break-all">
                  {webhookConfig.url}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(webhookConfig.url)}
                  className="px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)] hover:text-white transition-colors"
                  title="Copier"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Token</label>
              <div className="flex gap-2">
                <code className="flex-1 bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg text-sm text-green-400 font-mono">
                  {webhookConfig.token}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(webhookConfig.token)}
                  className="px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)] hover:text-white transition-colors"
                  title="Copier"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Utilisez ces informations pour configurer votre raccourci mobile (voir Dashboard).
            </p>
          </div>
        ) : (
          <div className="py-4 space-y-3">
            <p className="text-[var(--text-secondary)]">Webhook non configure</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Pour activer les raccourcis mobile, relancez avec un token de votre choix :
            </p>
            <code className="block bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg text-sm text-[var(--accent)] break-all">
              WEBHOOK_TOKEN=VotreMotDePasseSecret docker compose -f docker-compose.webhook.yml up -d
            </code>
            <p className="text-xs text-[var(--text-secondary)]">
              Le token est un secret que vous inventez. Il protege l'acces au webhook.
            </p>
          </div>
        )}
      </section>

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges}
          size="lg"
        >
          Sauvegarder les parametres
        </Button>
      </div>
    </div>
  )
}
