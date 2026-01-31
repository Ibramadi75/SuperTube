interface ToggleProps {
  label?: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ label, description, checked, onChange, disabled }: ToggleProps) {
  return (
    <label className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <div>
        {label && <span className="text-white font-medium">{label}</span>}
        {description && (
          <p className="text-sm text-[var(--text-secondary)]">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] ${
          checked ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          } mt-0.5`}
        />
      </button>
    </label>
  )
}
