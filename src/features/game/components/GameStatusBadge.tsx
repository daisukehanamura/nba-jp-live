import type { GameStatus } from '../schema'

interface GameStatusBadgeProps {
  status: GameStatus
  period?: number
  gameTime?: string
}

function getLiveLabel(period: number, gameTime: string): string {
  if (gameTime === 'Halftime' || gameTime === 'HT') return 'HT'
  if (period >= 5) return `OT`
  if (period >= 1) return `Q${period}`
  return 'LIVE'
}

export function GameStatusBadge({ status, period = 0, gameTime = '' }: GameStatusBadgeProps) {
  if (status === 'live') {
    const label = getLiveLabel(period, gameTime)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-red-500 text-white">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        {label}
      </span>
    )
  }

  if (status === 'final') {
    return (
      <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-500">
        終了
      </span>
    )
  }

  return (
    <span className="inline-block text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
      予定
    </span>
  )
}
