interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  color?: 'accent' | 'green' | 'blue'
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  showLabel = false,
  color = 'accent',
}: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  const colors = {
    accent: 'bg-[var(--accent)]',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
  }

  return (
    <div className="w-full">
      <div className={`w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden ${sizes[size]}`}>
        <div
          className={`${colors[color]} ${sizes[size]} rounded-full transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {percent.toFixed(0)}%
        </p>
      )}
    </div>
  )
}
