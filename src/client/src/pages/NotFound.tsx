import { Link } from 'react-router-dom'
import { Button } from '../components'

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <svg className="w-24 h-24 text-[var(--text-secondary)] mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-xl text-[var(--text-secondary)] mb-6">Page non trouvee</p>
      <Link to="/">
        <Button>Retour a l'accueil</Button>
      </Link>
    </div>
  )
}
