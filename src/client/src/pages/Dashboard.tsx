import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { DownloadForm, DownloadProgress, VideoCard, VideoPlayer } from '../components'
import { getWebhookConfig } from '../api'
import type { WebhookConfig } from '../types'

export function Dashboard() {
  const {
    videos,
    fetchVideos,
    downloads,
    fetchDownloads,
    stats,
    fetchStats,
    storage,
    fetchStorage,
    selectedVideo,
    setSelectedVideo,
    deleteVideo,
  } = useStore()

  const navigate = useNavigate()
  const [showManualDownload, setShowManualDownload] = useState(false)
  const [showMobileTutorial, setShowMobileTutorial] = useState(false)
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  useEffect(() => {
    fetchVideos()
    fetchDownloads()
    fetchStats()
    fetchStorage()
    getWebhookConfig().then(setWebhookConfig).catch(() => {})
  }, [fetchVideos, fetchDownloads, fetchStats, fetchStorage])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const activeDownloads = downloads.filter((d) => d.status === 0 || d.status === 1)
  const recentVideos = videos.slice(0, 6)

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Telecharger et gerer vos videos YouTube
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Videos"
            value={stats.totalVideos.toString()}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Taille totale"
            value={stats.formattedSize}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            }
          />
          <StatCard
            label="Duree totale"
            value={stats.formattedDuration}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Chaines"
            value={stats.channelCount.toString()}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Storage */}
      {storage && storage.percentUsed > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-secondary)]">Stockage</span>
            <span className="text-sm text-white">
              {storage.formattedUsed} / {storage.formattedTotal}
            </span>
          </div>
          <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                storage.percentUsed > 90 ? 'bg-red-500' : storage.percentUsed > 70 ? 'bg-amber-500' : 'bg-green-500'
              }`}
              style={{ width: `${storage.percentUsed}%` }}
            />
          </div>
        </div>
      )}

      {/* Active Downloads */}
      {activeDownloads.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Telechargements en cours ({activeDownloads.length})
          </h2>
          <div className="space-y-3">
            {activeDownloads.map((download) => (
              <DownloadProgress key={download.id} download={download} />
            ))}
          </div>
        </div>
      )}

      {/* Mobile Tutorials - Collapsible */}
      <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowMobileTutorial(!showMobileTutorial)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-[var(--text-secondary)]">Telecharger depuis mon telephone</span>
          </div>
          <svg
            className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${showMobileTutorial ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showMobileTutorial && (
          <div className="p-4 pt-0 border-t border-[var(--bg-tertiary)]">
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              {/* iOS Shortcut Tutorial */}
              <div className="bg-[var(--bg-tertiary)] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[var(--bg-primary)] rounded-xl">
                    <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white mb-2">iPhone</h2>
                    <p className="text-[var(--text-secondary)] text-sm mb-4">Via l'app Raccourcis</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center">1</div>
                        <p className="text-[var(--text-secondary)] text-sm">Creez un nouveau raccourci dans l'app</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center">2</div>
                        <p className="text-[var(--text-secondary)] text-sm">Ajoutez "Obtenir le contenu de l'URL"</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center">3</div>
                        <p className="text-[var(--text-secondary)] text-sm">Activez l'affichage dans la feuille de partage</p>
                      </div>
                    </div>

                    <div className="bg-[var(--bg-primary)] rounded-lg p-3 text-xs font-mono space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1">
                          <span>URL</span>
                          <button onClick={() => webhookConfig && copyToClipboard(webhookConfig.url, 'ios-url')} className="text-[var(--accent)] hover:underline">
                            {copiedField === 'ios-url' ? 'Copie!' : 'Copier'}
                          </button>
                        </div>
                        <p className="text-[var(--accent)] break-all">{webhookConfig?.url || 'chargement...'}</p>
                      </div>
                      <p><span className="text-[var(--text-secondary)]">Methode :</span> <span className="text-white">POST</span></p>
                      <p><span className="text-[var(--text-secondary)]">Corps :</span> <span className="text-white">{"{"}"url": "[Entree]"{"}"}</span></p>
                      {webhookConfig?.requiresToken && (
                        <div className="pt-2 border-t border-[var(--bg-tertiary)] flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">X-Webhook-Token</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => copyToClipboard(webhookConfig.token, 'ios-token')} className="text-[var(--accent)] hover:underline">
                              {copiedField === 'ios-token' ? 'Copie!' : 'Copier'}
                            </button>
                            <button onClick={() => navigate('/settings#webhook-token')} className="text-[var(--text-secondary)] hover:text-white" title="Configurer">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Android Tutorial */}
              <div className="bg-[var(--bg-tertiary)] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[var(--bg-primary)] rounded-xl">
                    <svg className="w-8 h-8 text-[#3DDC84]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.35-.63-2.85-1-4.47-1s-3.12.37-4.47 1L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-white mb-2">Android</h2>
                    <p className="text-[var(--text-secondary)] text-sm mb-4">Via l'app HTTP Shortcuts</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center">1</div>
                        <p className="text-[var(--text-secondary)] text-sm">Telechargez HTTP Shortcuts sur le Play Store</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center">2</div>
                        <p className="text-[var(--text-secondary)] text-sm">Creez un nouveau raccourci HTTP</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent)] text-white text-sm font-bold flex items-center justify-center">3</div>
                        <p className="text-[var(--text-secondary)] text-sm">Activez le menu de partage dans les options</p>
                      </div>
                    </div>

                    <div className="bg-[var(--bg-primary)] rounded-lg p-3 text-xs font-mono space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-[var(--text-secondary)] mb-1">
                          <span>URL</span>
                          <button onClick={() => webhookConfig && copyToClipboard(webhookConfig.url, 'android-url')} className="text-[var(--accent)] hover:underline">
                            {copiedField === 'android-url' ? 'Copie!' : 'Copier'}
                          </button>
                        </div>
                        <p className="text-[var(--accent)] break-all">{webhookConfig?.url || 'chargement...'}</p>
                      </div>
                      <p><span className="text-[var(--text-secondary)]">Methode :</span> <span className="text-white">POST</span></p>
                      <p><span className="text-[var(--text-secondary)]">Corps :</span> <span className="text-white">{"{"}"url": "{"{"}url{"}"}"{"}"}</span></p>
                      {webhookConfig?.requiresToken && (
                        <div className="pt-2 border-t border-[var(--bg-tertiary)] flex items-center justify-between">
                          <span className="text-[var(--text-secondary)]">X-Webhook-Token</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => copyToClipboard(webhookConfig.token, 'android-token')} className="text-[var(--accent)] hover:underline">
                              {copiedField === 'android-token' ? 'Copie!' : 'Copier'}
                            </button>
                            <button onClick={() => navigate('/settings#webhook-token')} className="text-[var(--text-secondary)] hover:text-white" title="Configurer">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Download - Collapsible */}
      <div className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowManualDownload(!showManualDownload)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[var(--text-secondary)]">Telecharger depuis l'interface web</span>
          </div>
          <svg
            className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${showManualDownload ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showManualDownload && (
          <div className="p-4 pt-0 border-t border-[var(--bg-tertiary)]">
            <DownloadForm />
          </div>
        )}
      </div>

      {/* Recent Videos */}
      {recentVideos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Videos recentes</h2>
            <Link
              to="/library"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Voir tout
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentVideos.map((video) => (
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
        </div>
      )}

      {/* Empty state */}
      {videos.length === 0 && activeDownloads.length === 0 && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto text-[var(--text-secondary)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">Aucune video</h3>
          <p className="text-[var(--text-secondary)]">
            Configurez le raccourci iOS ci-dessus pour commencer
          </p>
        </div>
      )}

      {/* Video Player Modal */}
      <VideoPlayer
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg text-[var(--accent)]">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        </div>
      </div>
    </div>
  )
}


