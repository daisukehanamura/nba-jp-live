import { notFound } from 'next/navigation'
import { getGameById } from '@/features/game/repository'
import { getComments } from '@/features/comment/repository'
import { GameStatusBadge } from '@/features/game/components/GameStatusBadge'
import { CommentFeed } from '@/features/comment/components/CommentFeed'
import { CommentForm } from '@/features/comment/components/CommentForm'

interface GamePageProps {
  params: Promise<{ id: string }>
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params
  const [game, initialComments] = await Promise.all([
    getGameById(id),
    getComments(id),
  ])

  if (!game) notFound()

  const scheduledDate = new Date(game.scheduledAt).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  })

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* 試合情報 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <GameStatusBadge status={game.status} />
          <span className="text-sm text-gray-400">{scheduledDate} JST</span>
        </div>
        <div className="flex items-center justify-between gap-4 py-6">
          <div className="flex-1 text-center">
            <p className="text-xl font-bold">{game.awayTeam}</p>
            {game.awayScore !== null && (
              <p className="text-5xl font-bold mt-2">{game.awayScore}</p>
            )}
          </div>
          <div className="text-gray-300 font-bold text-2xl">vs</div>
          <div className="flex-1 text-center">
            <p className="text-xl font-bold">{game.homeTeam}</p>
            {game.homeScore !== null && (
              <p className="text-5xl font-bold mt-2">{game.homeScore}</p>
            )}
          </div>
        </div>
      </div>

      {/* コメントセクション */}
      <div className="border-t pt-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          コメント
        </h2>
        <CommentFeed gameId={game.id} initialComments={initialComments} />
        <CommentForm gameId={game.id} />
      </div>
    </main>
  )
}
