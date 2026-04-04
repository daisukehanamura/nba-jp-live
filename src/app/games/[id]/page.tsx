import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGameById } from '@/features/game/repository'
import { getComments } from '@/features/comment/repository'
import { getProfile } from '@/features/auth/repository'
import { GameStatusBadge } from '@/features/game/components/GameStatusBadge'
import { TeamDisplay } from '@/features/game/components/TeamDisplay'
import { CommentSection } from '@/features/comment/components/CommentSection'
import { createClient } from '@/lib/supabase/server'

interface GamePageProps {
  params: Promise<{ id: string }>
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [game, initialComments, profile] = await Promise.all([
    getGameById(id),
    getComments(id),
    user ? getProfile(user.id) : null,
  ])

  if (!game) notFound()

  const dateStr = new Date(game.scheduledAt).toISOString().split('T')[0]
  const time = new Date(game.scheduledAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  })

  const hasScore = game.homeScore !== null && game.awayScore !== null
  const awayWins = hasScore && game.awayScore! > game.homeScore!
  const homeWins = hasScore && game.homeScore! > game.awayScore!

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <Link
        href={`/games?date=${dateStr}`}
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
      >
        ← 試合一覧に戻る
      </Link>

      {/* 試合カード */}
      <div className="bg-white rounded-2xl border border-gray-200 px-6 py-6 mb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <GameStatusBadge status={game.status} />
          <span className="text-sm text-gray-400">{time} JST</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamDisplay teamName={game.awayTeam} score={game.awayScore} isWinner={awayWins} size="lg" />
          <div className="flex flex-col items-center gap-1 pb-6">
            <span className="text-gray-200 font-bold text-3xl">–</span>
            <span className="text-xs text-gray-400">AWAY / HOME</span>
          </div>
          <TeamDisplay teamName={game.homeTeam} score={game.homeScore} isWinner={homeWins} size="lg" />
        </div>
      </div>

      {/* コメントセクション */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        {user && profile ? (
          <CommentSection
            gameId={game.id}
            initialComments={initialComments}
            currentUserId={user.id}
            currentUserProfile={{
              username: profile.username,
              displayName: profile.displayName,
              avatarUrl: profile.avatarUrl,
            }}
          />
        ) : (
          <p className="text-center text-sm text-gray-400 py-10">
            コメントするには{' '}
            <Link href="/auth/login" className="text-blue-500 hover:underline font-medium">
              ログイン
            </Link>
            {' '}が必要です
          </p>
        )}
      </div>
    </main>
  )
}
