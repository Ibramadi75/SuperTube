import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Dashboard, Library, Settings, Subscriptions, NotFound, Login, Users } from './pages'
import { Toasts } from './components'
import { useStore } from './store'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authLoading } = useStore()
  if (authLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useStore()
  if (authLoading) return null
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

function UserMenu() {
  const { user, logout } = useStore()
  if (!user) return null

  return (
    <div className="flex items-center gap-2">
      {user.role === 'admin' && (
        <NavLink
          to="/users"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg transition-colors text-sm flex items-center gap-1.5 ${
              isActive
                ? 'bg-[var(--bg-tertiary)] text-white'
                : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
            }`
          }
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span className="hidden sm:inline">Users</span>
        </NavLink>
      )}
      <div className="flex items-center gap-2 ml-1">
        <span className="text-sm text-[var(--text-secondary)] hidden sm:inline">{user.displayName}</span>
        <button
          onClick={logout}
          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)] transition-colors"
          title="Deconnexion"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--bg-tertiary)] px-4 py-3 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 text-xl font-bold text-[var(--accent)]">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
            SuperTube
            <span className="text-xs font-normal text-[var(--text-tertiary)]">v{__APP_VERSION__}</span>
          </NavLink>

          <div className="flex items-center gap-1">
            {/* Navigation */}
            <nav className="flex gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-[var(--bg-tertiary)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
                  }`
                }
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </NavLink>
              <NavLink
                to="/library"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-[var(--bg-tertiary)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
                  }`
                }
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="hidden sm:inline">Bibliotheque</span>
              </NavLink>
              <NavLink
                to="/subscriptions"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-[var(--bg-tertiary)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
                  }`
                }
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="hidden sm:inline">Abonnements</span>
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isActive
                      ? 'bg-[var(--bg-tertiary)] text-white'
                      : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]'
                  }`
                }
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Parametres</span>
              </NavLink>
            </nav>

            {/* User menu */}
            <div className="ml-2 pl-2 border-l border-[var(--bg-tertiary)]">
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto">{children}</main>

      {/* Toasts */}
      <Toasts />
    </div>
  )
}

function App() {
  const checkAuth = useStore((s) => s.checkAuth)

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/library/:channel" element={<Library />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route
                    path="/users"
                    element={
                      <AdminRoute>
                        <Users />
                      </AdminRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
