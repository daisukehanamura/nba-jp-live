import Link from 'next/link'
import type { Game } from '../schema'
import { GameStatusBadge } from './GameStatusBadge'

interface GameCardProps {
  game: Game
}

export function GameCard({ game }: GameCardProps) {
  const scheduledDate = new Date(game.scheduledAt).toLocaleString('ja-JP', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  })

  return (
    <Link href={`/games/${game.id}`}>
      <div className="border rounded-lg p-4 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <GameStatusBadge status={game.status} />
          <span className="text-xs text-gray-400">{scheduledDate} JST</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <p className="font-bold text-lg">{game.awayTeam}</p>
            {game.awayScore !== null && (
              <p className="text-3xl font-bold mt-1">{game.awayScore}</p>
            )}
          </div>
          <div className="text-gray-300 font-bold text-xl">vs</div>
          <div className="flex-1 text-center">
            <p className="font-bold text-lg">{game.homeTeam}</p>
            {game.homeScore !== null && (
              <p className="text-3xl font-bold mt-1">{game.homeScore}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
