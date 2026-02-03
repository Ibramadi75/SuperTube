import { useEffect, useState } from 'react'
import { useStore } from '../store'
import { Button } from '../components'

export function Subscriptions() {
  const {
    subscriptions,
    subscriptionsLoading,
    fetchSubscriptions,
    createSubscription,
    toggleSubscription,
    deleteSubscription,
    checkAllSubscriptions,
  } = useStore()

  const [newChannelUrl, setNewChannelUrl] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const handleAddSubscription = async () => {
    if (!newChannelUrl.trim()) return
    setIsAdding(true)
    await createSubscription(newChannelUrl.trim())
    setNewChannelUrl('')
    setIsAdding(false)
  }

  const handleCheckAll = async () => {
    setIsChecking(true)
    await checkAllSubscriptions()
    setIsChecking(false)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Abonnements</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Suivi automatique des nouvelles videos de vos chaines favorites
          </p>
        </div>
        <Button
          onClick={handleCheckAll}
          disabled={isChecking || subscriptions.length === 0}
          variant="secondary"
        >
          {isChecking ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Verification...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Verifier maintenant
            </>
          )}
        </Button>
      </div>

      {/* Add subscription */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={newChannelUrl}
            onChange={(e) => setNewChannelUrl(e.target.value)}
            placeholder="URL de la chaine YouTube (ex: https://youtube.com/@channel)"
            className="flex-1 px-4 py-2 bg-[var(--bg-tertiary)] rounded-lg text-white placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubscription()}
          />
          <Button onClick={handleAddSubscription} disabled={isAdding || !newChannelUrl.trim()}>
            {isAdding ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </div>

      {/* Subscriptions list */}
      {subscriptionsLoading && subscriptions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-[var(--accent)]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-[var(--text-secondary)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">Aucun abonnement</h3>
          <p className="text-[var(--text-secondary)] mb-4">
            Telechargez une video ou ajoutez une chaine manuellement pour commencer.
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Les nouvelles videos seront automatiquement telechargees.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((subscription) => (
            <div
              key={subscription.id}
              className={`bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center gap-4 ${
                !subscription.isActive ? 'opacity-60' : ''
              }`}
            >
              {/* Channel info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white truncate">{subscription.channelName}</h3>
                  {!subscription.isActive && (
                    <span className="text-xs px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded">
                      Desactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-[var(--text-secondary)]">
                  <span>{subscription.totalDownloaded} videos</span>
                  <span>Dernier check: {formatDate(subscription.lastCheckedAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Toggle active */}
                <button
                  onClick={() => toggleSubscription(subscription.id, !subscription.isActive)}
                  className={`p-2 rounded-lg transition-colors ${
                    subscription.isActive
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                  }`}
                  title={subscription.isActive ? 'Desactiver' : 'Activer'}
                >
                  {subscription.isActive ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>

                {/* Open channel */}
                <a
                  href={subscription.channelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)] hover:text-white transition-colors"
                  title="Ouvrir la chaine"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                {/* Delete */}
                <button
                  onClick={() => {
                    if (confirm(`Supprimer l'abonnement a "${subscription.channelName}" ?`))
                      deleteSubscription(subscription.id)
                  }}
                  className="p-2 bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                  title="Supprimer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-sm text-[var(--text-secondary)]">
        <p>
          <strong className="text-white">Comment ca marche :</strong> Quand vous telechargez une video,
          SuperTube s'abonne automatiquement a la chaine. Toutes les heures (entre 9h et 21h),
          les nouvelles videos sont detectees et telechargees automatiquement.
        </p>
      </div>
    </div>
  )
}
