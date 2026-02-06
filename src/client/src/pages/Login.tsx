import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError((err as Error).message || 'Connexion echouee')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-[var(--accent)] mb-2">
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
            SuperTube
          </div>
          <p className="text-[var(--text-secondary)] text-sm">Connectez-vous pour continuer</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[var(--bg-secondary)] rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Nom d'utilisateur</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] text-white border border-[var(--bg-tertiary)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
