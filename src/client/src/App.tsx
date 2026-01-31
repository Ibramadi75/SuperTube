import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'

// Pages (placeholder for now)
function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-[var(--text-secondary)]">Bienvenue sur SuperTube</p>
    </div>
  )
}

function Library() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Bibliotheque</h1>
      <p className="text-[var(--text-secondary)]">Vos videos telechargees</p>
    </div>
  )
}

function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Parametres</h1>
      <p className="text-[var(--text-secondary)]">Configuration de l'application</p>
    </div>
  )
}

function NotFound() {
  return (
    <div className="p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p className="text-[var(--text-secondary)]">Page non trouvee</p>
    </div>
  )
}

// Layout
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--bg-tertiary)] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--accent)]">SuperTube</h1>
          <nav className="flex gap-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[var(--bg-tertiary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/library"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[var(--bg-tertiary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`
              }
            >
              Bibliotheque
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[var(--bg-tertiary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`
              }
            >
              Parametres
            </NavLink>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto">{children}</main>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

export default App
