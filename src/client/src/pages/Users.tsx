import { useEffect, useState } from 'react'
import { useStore } from '../store'
import type { User } from '../types'
import * as api from '../api'
import { Button, Modal } from '../components'

const QUOTA_OPTIONS = [
  { label: 'Illimite', value: 0 },
  { label: '1 Go', value: 1073741824 },
  { label: '5 Go', value: 5368709120 },
  { label: '10 Go', value: 10737418240 },
  { label: '50 Go', value: 53687091200 },
]

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const sizes = ['B', 'Ko', 'Mo', 'Go', 'To']
  let len = bytes
  let order = 0
  while (len >= 1024 && order < sizes.length - 1) {
    order++
    len /= 1024
  }
  return `${len.toFixed(1)} ${sizes[order]}`
}

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const addToast = useStore((s) => s.addToast)

  async function fetchUsers() {
    try {
      const data = await api.getUsers()
      setUsers(data)
    } catch {
      addToast('Erreur lors du chargement des utilisateurs', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  async function handleDelete(user: User) {
    if (!confirm(`Supprimer l'utilisateur "${user.displayName}" et toutes ses donnees ?`))
      return
    try {
      await api.deleteUser(user.id)
      setUsers(users.filter((u) => u.id !== user.id))
      addToast('Utilisateur supprime', 'success')
    } catch (err) {
      addToast((err as Error).message, 'error')
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Utilisateurs</h1>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          Ajouter
        </Button>
      </div>

      {loading ? (
        <div className="text-center text-[var(--text-secondary)] py-12">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="bg-[var(--bg-secondary)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">{user.displayName}</span>
                  <span className="text-xs text-[var(--text-tertiary)]">@{user.username}</span>
                  {user.role === 'admin' && (
                    <span className="text-xs bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <div className="text-sm text-[var(--text-secondary)] mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Stockage : {formatBytes(user.storageUsedBytes ?? 0)}
                    {user.storageQuotaBytes ? ` / ${formatBytes(user.storageQuotaBytes)}` : ' (illimite)'}
                  </span>
                  {user.createdAt && (
                    <span>Cree le {new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
                  )}
                </div>
                {user.storageQuotaBytes && user.storageQuotaBytes > 0 && (
                  <div className="mt-2 w-full bg-[var(--bg-tertiary)] rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((user.storageUsedBytes ?? 0) / user.storageQuotaBytes) * 100)}%`,
                        backgroundColor:
                          ((user.storageUsedBytes ?? 0) / user.storageQuotaBytes) > 0.9
                            ? '#ef4444'
                            : ((user.storageUsedBytes ?? 0) / user.storageQuotaBytes) > 0.7
                              ? '#f59e0b'
                              : 'var(--accent)',
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setEditUser(user)}>
                  Modifier
                </Button>
                {user.role !== 'admin' && (
                  <Button variant="danger" size="sm" onClick={() => handleDelete(user)}>
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateUserModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            fetchUsers()
          }}
        />
      )}

      {/* Edit modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={() => {
            setEditUser(null)
            fetchUsers()
          }}
        />
      )}
    </div>
  )
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('user')
  const [quotaValue, setQuotaValue] = useState(0)
  const [customQuota, setCustomQuota] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const addToast = useStore((s) => s.addToast)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const quota = quotaValue === -1 ? Number(customQuota) * 1073741824 : quotaValue === 0 ? null : quotaValue

    try {
      await api.createUser({
        username,
        password,
        displayName: displayName || undefined,
        role,
        storageQuotaBytes: quota,
      })
      addToast('Utilisateur cree', 'success')
      onCreated()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen title="Nouvel utilisateur" onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Nom d'utilisateur</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            required
            minLength={3}
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            required
            minLength={4}
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Nom d'affichage</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={username || 'Optionnel'}
            className="w-full bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Quota stockage</label>
          <select
            value={quotaValue}
            onChange={(e) => setQuotaValue(Number(e.target.value))}
            className="w-full bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {QUOTA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            <option value={-1}>Personnalise</option>
          </select>
          {quotaValue === -1 && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={customQuota}
                onChange={(e) => setCustomQuota(e.target.value)}
                placeholder="Taille"
                min="1"
                className="flex-1 bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <span className="text-[var(--text-secondary)] text-sm">Go</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Creer
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function EditUserModal({
  user,
  onClose,
  onUpdated,
}: {
  user: User
  onClose: () => void
  onUpdated: () => void
}) {
  const [displayName, setDisplayName] = useState(user.displayName)
  const [role, setRole] = useState(user.role)
  const [quotaValue, setQuotaValue] = useState(
    user.storageQuotaBytes
      ? QUOTA_OPTIONS.find((o) => o.value === user.storageQuotaBytes)
        ? user.storageQuotaBytes
        : -1
      : 0
  )
  const [customQuota, setCustomQuota] = useState(
    user.storageQuotaBytes && !QUOTA_OPTIONS.find((o) => o.value === user.storageQuotaBytes)
      ? String(Math.round(user.storageQuotaBytes / 1073741824))
      : ''
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const addToast = useStore((s) => s.addToast)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const quota = quotaValue === -1 ? Number(customQuota) * 1073741824 : quotaValue

    try {
      await api.updateUser(user.id, {
        displayName,
        role,
        storageQuotaBytes: quota,
      })
      addToast('Utilisateur modifie', 'success')
      onUpdated()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen title={`Modifier ${user.displayName}`} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Nom d'affichage</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="user">Utilisateur</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-[var(--text-secondary)] mb-1">Quota stockage</label>
          <select
            value={quotaValue}
            onChange={(e) => setQuotaValue(Number(e.target.value))}
            className="w-full bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {QUOTA_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            <option value={-1}>Personnalise</option>
          </select>
          {quotaValue === -1 && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={customQuota}
                onChange={(e) => setCustomQuota(e.target.value)}
                placeholder="Taille"
                min="1"
                className="flex-1 bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <span className="text-[var(--text-secondary)] text-sm">Go</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
