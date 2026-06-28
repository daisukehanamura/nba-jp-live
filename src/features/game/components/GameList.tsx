import { getGamesByDate } from '@/features/game/repository'
import { getCommentCounts } from '@/features/comment/repository'
import { getVoiceParticipantCounts } from '@/features/voice/repository'
import { GameCard } from './GameCard'
import { LiveRefresh } from './LiveRefresh'

interface GameListProps {
  currentDate: string
  isToday: boolean
}

export async function GameList({ currentDate, isToday }: GameListProps) {
  const games = await getGamesByDate(currentDate)
  const [commentCounts, voiceCounts] = await Promise.all([
    getCommentCounts(games.map((g) => g.id)),
    isToday
      ? getVoiceParticipantCounts(games.map((g) => g.id)).catch(() => ({} as Record<string, number>))
      : Promise.resolve({} as Record<string, number>),
  ])

  const liveGames = games.filter((g) => g.status === 'live')
  const scheduledGames = games.filter((g) => g.status === 'scheduled')
  const finalGames = games.filter((g) => g.status === 'final')

  return (
    <>
      <LiveRefresh hasLiveGames={liveGames.length > 0} />

      {liveGames.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">
            ● 試合中
          </h2>
          <ul className="flex flex-col gap-3">
            {liveGames.map((game) => (
              <li key={game.id}>
                <GameCard game={game} commentCount={commentCounts[game.id] ?? 0} voiceCount={voiceCounts[game.id] ?? 0} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {scheduledGames.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">
            予定
          </h2>
          <ul className="flex flex-col gap-3">
            {scheduledGames.map((game) => (
              <li key={game.id}>
                <GameCard game={game} commentCount={commentCounts[game.id] ?? 0} voiceCount={voiceCounts[game.id] ?? 0} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {finalGames.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">
            終了
          </h2>
          <ul className="flex flex-col gap-3">
            {finalGames.map((game) => (
              <li key={game.id}>
                <GameCard game={game} commentCount={commentCounts[game.id] ?? 0} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {games.length === 0 && (
        <div className="text-center py-20 text-gray-600">
          <p className="text-4xl mb-3">🏀</p>
          <p className="text-sm">この日の試合はありません</p>
        </div>
      )}
    </>
  )
}
