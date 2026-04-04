import Link from 'next/link'
import type { Game } from '../schema'
import { GameStatusBadge } from './GameStatusBadge'
import { TeamDisplay } from './TeamDisplay'

interface GameCardProps {
  game: Game
}

export function GameCard({ game }: GameCardProps) {
  const time = new Date(game.scheduledAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  })

  const hasScore = game.homeScore !== null && game.awayScore !== null
  const awayWins = hasScore && game.awayScore! > game.homeScore!
  const homeWins = hasScore && game.homeScore! > game.awayScore!

  return (
    <Link href={`/games/${game.id}`} className="block">
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.99]">
        <div className="flex items-center justify-between mb-3">
          <GameStatusBadge status={game.status} />
          <span className="text-xs text-gray-400">{time} JST</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <TeamDisplay teamName={game.awayTeam} score={game.awayScore} isWinner={awayWins} size="sm" />
          <div className="text-gray-200 font-bold text-lg pb-4">–</div>
          <TeamDisplay teamName={game.homeTeam} score={game.homeScore} isWinner={homeWins} size="sm" />
        </div>
      </div>
    </Link>
  )
}
