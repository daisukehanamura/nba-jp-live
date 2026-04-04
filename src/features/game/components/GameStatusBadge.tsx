import type { GameStatus } from '../schema'

interface GameStatusBadgeProps {
  status: GameStatus
}

const statusConfig: Record<GameStatus, { label: string; className: string }> = {
  scheduled: {
    label: '予定',
    className: 'bg-gray-100 text-gray-600',
  },
  live: {
    label: 'LIVE',
    className: 'bg-red-500 text-white animate-pulse',
  },
  final: {
    label: '終了',
    className: 'bg-gray-200 text-gray-500',
  },
}

export function GameStatusBadge({ status }: GameStatusBadgeProps) {
  const { label, className } = statusConfig[status]
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${className}`}>
      {label}
    </span>
  )
}
