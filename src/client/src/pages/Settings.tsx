import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Button, Select, Toggle } from '../components'
import { getWebhookConfig, updateWebhookConfig, regenerateWebhookToken } from '../api'
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
  const [webhookLoading, setWebhookLoading] = useState(false)

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

  const handleWebhookToggle = async (enabled: boolean) => {
    setWebhookLoading(true)
    try {
      const updated = await updateWebhookConfig(enabled)
      setWebhookConfig(updated)
    } catch (error) {
      console.error('Failed to update webhook config:', error)
    } finally {
      setWebhookLoading(false)
    }
  }

  const handleRegenerateToken = async () => {
    setWebhookLoading(true)
    try {
      const { token } = await regenerateWebhookToken()
      if (webhookConfig) {
        setWebhookConfig({ ...webhookConfig, token })
      }
    } catch (error) {
      console.error('Failed to regenerate token:', error)
    } finally {
      setWebhookLoading(false)
    }
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
        <h2 className="text-lg font-semibold text-white">Securite Webhook</h2>
        {webhookConfig ? (
          <div className="space-y-4">
            <Toggle
              label="Exiger un token d'authentification"
              description="Protege le webhook contre les acces non autorises"
              checked={webhookConfig.requiresToken}
              onChange={handleWebhookToggle}
              disabled={webhookLoading}
            />

            {!webhookConfig.requiresToken && (
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-amber-200">
                  <p className="font-medium">Acces ouvert</p>
                  <p className="text-amber-300/80">N'importe qui connaissant l'URL peut declencher des telechargements.</p>
                </div>
              </div>
            )}

            {webhookConfig.requiresToken && (
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-medium">Webhook securise</span>
                </div>
                <button
                  onClick={handleRegenerateToken}
                  disabled={webhookLoading}
                  className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors disabled:opacity-50"
                >
                  Regenerer le token
                </button>
              </div>
            )}

            <p className="text-sm text-[var(--text-secondary)]">
              URL et token disponibles dans le Dashboard, section tutoriels.
            </p>
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-[var(--text-secondary)]">Chargement...</p>
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
