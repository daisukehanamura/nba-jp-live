import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getGameById } from '@/features/game/repository'
import { getComments } from '@/features/comment/repository'
import { getProfile } from '@/features/auth/repository'
import { GameStatusBadge } from '@/features/game/components/GameStatusBadge'
import { TeamDisplay } from '@/features/game/components/TeamDisplay'
import { CommentSection } from '@/features/comment/components/CommentSection'
import { GuestCommentView } from '@/features/comment/components/GuestCommentView'
import { PredictionPanel } from '@/features/prediction/components/PredictionPanel'
import { VoiceRoom } from '@/features/voice/components/VoiceRoom'
import { getPredictionSummary } from '@/features/prediction/repository'
import { getUser } from '@/lib/supabase/server'
import { XShareButton } from '@/components/XShareButton'

interface GamePageProps {
  params: Promise<{ id: string }>
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params

  const [user, game, initialComments] = await Promise.all([
    getUser(),
    getGameById(id),
    getComments(id),
  ])

  if (!game) notFound()

  const [profile, predictionSummary] = await Promise.all([
    user ? getProfile(user.id) : Promise.resolve(null),
    getPredictionSummary(game.id, user?.id ?? null),
  ])

  const dateStr = new Date(game.scheduledAt).toISOString().split('T')[0]
  const time = new Date(game.scheduledAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  })

  const hasScore = game.homeScore !== null && game.awayScore !== null
  const awayWins = hasScore && game.awayScore! > game.homeScore!
  const homeWins = hasScore && game.homeScore! > game.awayScore!

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nba-jp-live-app-dell.vercel.app'
  const gameUrl = `${appUrl}/games/${game.id}`
  const gameShareText = hasScore
    ? `🏀 ${game.awayTeam} ${game.awayScore} - ${game.homeScore} ${game.homeTeam}\nHOOPMINで観戦中！ #HOOPMIN #NBA #NBAjapan`
    : `🏀 ${game.awayTeam} vs ${game.homeTeam} を観戦中！\nHOOPMINで一緒に盛り上がろう 🔥 #HOOPMIN #NBA #NBAjapan`

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
      <Link
        href={`/games?date=${dateStr}`}
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 -mb-2"
      >
        ← 試合一覧に戻る
      </Link>

      {/* 試合カード */}
      <div className="bg-white rounded-2xl border border-gray-200 px-6 py-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <GameStatusBadge status={game.status} period={game.period} gameTime={game.gameTime} />
          <span className="text-sm text-gray-600">{time} JST</span>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamDisplay teamName={game.awayTeam} score={game.awayScore} isWinner={awayWins} size="lg" />
          <div className="flex flex-col items-center gap-1 pb-6">
            <span className="text-gray-200 font-bold text-3xl">–</span>
            <span className="text-xs text-gray-500">AWAY / HOME</span>
          </div>
          <TeamDisplay teamName={game.homeTeam} score={game.homeScore} isWinner={homeWins} size="lg" />
        </div>
        <div className="flex justify-end mt-2">
          <XShareButton text={gameShareText} url={gameUrl} />
        </div>
      </div>

      {/* 勝利予測 */}
      <PredictionPanel
        gameId={game.id}
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
        gameStatus={game.status}
        period={game.period}
        initialSummary={predictionSummary}
        isLoggedIn={!!user}
        gameUrl={gameUrl}
      />

      {/* 音声通話 */}
      <VoiceRoom gameId={game.id} isLoggedIn={!!user} scheduledAt={game.scheduledAt} />

      {/* コメントセクション */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm mb-4">
        {user ? (
          <CommentSection
            gameId={game.id}
            initialComments={initialComments}
            currentUserId={user.id}
            currentUserProfile={{
              username: profile?.username ?? user.email?.split('@')[0] ?? 'user',
              displayName: profile?.displayName ?? user.email?.split('@')[0] ?? 'ユーザー',
              avatarUrl: profile?.avatarUrl ?? null,
            }}
          />
        ) : (
          <GuestCommentView gameId={game.id} initialComments={initialComments} />
        )}
      </div>
    </main>
  )
}
