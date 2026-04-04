import { getGamesByDate } from '@/features/game/repository'
import { GameCard } from '@/features/game/components/GameCard'
import { DateNav } from '@/features/game/components/DateNav'

interface GamesPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const { date } = await searchParams
  const today = new Date().toISOString().split('T')[0]!
  const currentDate = date ?? today

  const games = await getGamesByDate(currentDate)

  const liveGames = games.filter((g) => g.status === 'live')
  const scheduledGames = games.filter((g) => g.status === 'scheduled')
  const finalGames = games.filter((g) => g.status === 'final')

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">NBA 試合</h1>

      <div className="mb-6">
        <DateNav currentDate={currentDate} />
      </div>

      {liveGames.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-3">
            ● 試合中
          </h2>
          <ul className="flex flex-col gap-3">
            {liveGames.map((game) => (
              <li key={game.id}><GameCard game={game} /></li>
            ))}
          </ul>
        </section>
      )}

      {scheduledGames.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            予定
          </h2>
          <ul className="flex flex-col gap-3">
            {scheduledGames.map((game) => (
              <li key={game.id}><GameCard game={game} /></li>
            ))}
          </ul>
        </section>
      )}

      {finalGames.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            終了
          </h2>
          <ul className="flex flex-col gap-3">
            {finalGames.map((game) => (
              <li key={game.id}><GameCard game={game} /></li>
            ))}
          </ul>
        </section>
      )}

      {games.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🏀</p>
          <p className="text-sm">この日の試合はありません</p>
        </div>
      )}
    </main>
  )
}
