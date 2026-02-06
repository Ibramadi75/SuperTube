import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../store'
import { Button, Select, Toggle } from '../components'
import { getWebhookConfig, updateWebhookConfig, regenerateWebhookToken, setWebhookToken, getNtfyConfig, updateNtfyConfig, testNtfyNotification, api } from '../api'
import type { WebhookConfig, NtfyConfig, SubscriptionsSettings } from '../types'

export function Settings() {
  const {
    settings,
    settingsLoading,
    fetchSettings,
    updateSettings,
    storage,
    fetchStorage,
  } = useStore()

  const location = useLocation()
  const webhookSectionRef = useRef<HTMLElement>(null)

  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
  const [webhookLoading, setWebhookLoading] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)

  const [ntfyConfig, setNtfyConfig] = useState<NtfyConfig | null>(null)
  const [ntfyLoading, setNtfyLoading] = useState(false)
  const [ntfyTopic, setNtfyTopic] = useState('')
  const [ntfyTestSent, setNtfyTestSent] = useState(false)

  const [subscriptionSettings, setSubscriptionSettings] = useState({
    enabled: true,
    autoSubscribe: true,
    cron: '0 * 9-21 * * *',
  })

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
    getWebhookConfig().then((config) => {
      setWebhookConfig(config)
      setTokenInput(config.token)
    }).catch(() => {})
    getNtfyConfig().then((config) => {
      setNtfyConfig(config)
      setNtfyTopic(config.topic)
    }).catch(() => {})

    // Fetch subscription settings
    api.get<{ data: { subscriptions: SubscriptionsSettings } }>('/api/settings').then((response) => {
      if (response.data.subscriptions) {
        setSubscriptionSettings(response.data.subscriptions)
      }
    }).catch(() => {})
  }, [fetchSettings, fetchStorage])

  // Scroll to webhook section if hash is present
  useEffect(() => {
    if (location.hash === '#webhook-token' && webhookSectionRef.current) {
      webhookSectionRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location.hash, webhookConfig])

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
        setTokenInput(token)
      }
    } catch (error) {
      console.error('Failed to regenerate token:', error)
    } finally {
      setWebhookLoading(false)
    }
  }

  const handleSetToken = async () => {
    if (!tokenInput.trim()) return
    setWebhookLoading(true)
    try {
      const { token } = await setWebhookToken(tokenInput.trim())
      if (webhookConfig) {
        setWebhookConfig({ ...webhookConfig, token })
      }
    } catch (error) {
      console.error('Failed to set token:', error)
    } finally {
      setWebhookLoading(false)
    }
  }

  const handleCopyToken = () => {
    if (webhookConfig?.token) {
      navigator.clipboard.writeText(webhookConfig.token)
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    }
  }

  const handleNtfyToggle = async (enabled: boolean) => {
    setNtfyLoading(true)
    try {
      const updated = await updateNtfyConfig(enabled, ntfyTopic)
      setNtfyConfig(updated)
    } catch (error) {
      console.error('Failed to update ntfy config:', error)
    } finally {
      setNtfyLoading(false)
    }
  }

  const handleNtfySaveTopic = async () => {
    if (!ntfyTopic.trim()) return
    setNtfyLoading(true)
    try {
      const updated = await updateNtfyConfig(ntfyConfig?.enabled ?? false, ntfyTopic.trim())
      setNtfyConfig(updated)
    } catch (error) {
      console.error('Failed to save ntfy topic:', error)
    } finally {
      setNtfyLoading(false)
    }
  }

  const handleNtfyTest = async () => {
    setNtfyLoading(true)
    try {
      await testNtfyNotification()
      setNtfyTestSent(true)
      setTimeout(() => setNtfyTestSent(false), 3000)
    } catch (error) {
      console.error('Failed to send test notification:', error)
    } finally {
      setNtfyLoading(false)
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

      {/* Subscriptions */}
      <section className="bg-[var(--bg-secondary)] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Abonnements automatiques</h2>
        <Toggle
          label="Activer les abonnements"
          description="Verifier automatiquement les nouvelles videos des chaines suivies"
          checked={subscriptionSettings.enabled}
          onChange={async (checked) => {
            setSubscriptionSettings((prev) => ({ ...prev, enabled: checked }))
            await api.put('/api/settings', { subscriptions: { enabled: checked } })
          }}
        />
        <Toggle
          label="Auto-abonnement"
          description="S'abonner automatiquement aux chaines lors d'un telechargement"
          checked={subscriptionSettings.autoSubscribe}
          onChange={async (checked) => {
            setSubscriptionSettings((prev) => ({ ...prev, autoSubscribe: checked }))
            await api.put('/api/settings', { subscriptions: { autoSubscribe: checked } })
          }}
        />
        {subscriptionSettings.enabled && (
          <Select
            label="Frequence de verification"
            value={subscriptionSettings.cron}
            onChange={async (e) => {
              const value = e.target.value
              setSubscriptionSettings((prev) => ({ ...prev, cron: value }))
              await api.put('/api/settings', { subscriptions: { cron: value } })
            }}
            options={[
              { value: '0 * 9-21 * * *', label: 'Toutes les heures (9h-21h)' },
              { value: '0 */2 9-21 * * *', label: 'Toutes les 2 heures (9h-21h)' },
              { value: '0 0 12 * * *', label: 'Une fois par jour (12h)' },
              { value: '0 0 */6 * * *', label: 'Toutes les 6 heures' },
            ]}
          />
        )}
        <p className="text-sm text-[var(--text-secondary)]">
          Les nouvelles videos des chaines suivies seront automatiquement telechargees.
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
      <section id="webhook-token" ref={webhookSectionRef} className="bg-[var(--bg-secondary)] rounded-xl p-6 space-y-4">
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
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                  <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm font-medium text-green-400">Webhook securise</span>
                </div>

                {/* Token input */}
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Token d'authentification</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showToken ? 'text' : 'password'}
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        className="w-full px-3 py-2 pr-10 bg-[var(--bg-tertiary)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        placeholder="Entrez votre token..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-white"
                      >
                        {showToken ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <button
                      onClick={handleSetToken}
                      disabled={webhookLoading || tokenInput === webhookConfig.token}
                      className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyToken}
                    disabled={webhookLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg text-sm hover:text-white transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {tokenCopied ? 'Copie!' : 'Copier'}
                  </button>
                  <button
                    onClick={handleRegenerateToken}
                    disabled={webhookLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg text-sm hover:text-white transition-colors disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerer
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-[var(--text-secondary)]">Chargement...</p>
          </div>
        )}
      </section>

      {/* Notifications */}
      <section className="bg-[var(--bg-secondary)] rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Notifications</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Recevez une notification sur votre telephone quand un telechargement est termine.
        </p>
        {ntfyConfig ? (
          <div className="space-y-4">
            <Toggle
              label="Activer les notifications Ntfy"
              description="Envoi une notification push via ntfy.sh"
              checked={ntfyConfig.enabled}
              onChange={handleNtfyToggle}
              disabled={ntfyLoading}
            />

            {ntfyConfig.enabled && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Topic Ntfy</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ntfyTopic}
                      onChange={(e) => setNtfyTopic(e.target.value)}
                      className="flex-1 px-3 py-2 bg-[var(--bg-tertiary)] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      placeholder="supertube-monnom"
                    />
                    <button
                      onClick={handleNtfySaveTopic}
                      disabled={ntfyLoading || ntfyTopic === ntfyConfig.topic}
                      className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Enregistrer
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-2">
                    Choisissez un nom unique. Dans l'app Ntfy, abonnez-vous a ce topic.
                  </p>
                </div>

                <button
                  onClick={handleNtfyTest}
                  disabled={ntfyLoading || !ntfyConfig.topic}
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg text-sm hover:text-white transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {ntfyTestSent ? 'Notification envoyee!' : 'Tester la notification'}
                </button>

                <div className="p-3 bg-[var(--bg-tertiary)] rounded-lg">
                  <p className="text-xs text-[var(--text-secondary)]">
                    <span className="font-medium text-white">Comment configurer :</span><br />
                    1. Installez l'app <span className="text-[var(--accent)]">Ntfy</span> sur votre telephone<br />
                    2. Abonnez-vous au topic : <span className="text-[var(--accent)]">{ntfyTopic || 'votre-topic'}</span><br />
                    3. Vous recevrez une notification a chaque telechargement termine
                  </p>
                </div>
              </div>
            )}
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
