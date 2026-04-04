import { getGames } from '@/features/game/repository'
import { GameCard } from '@/features/game/components/GameCard'

export default async function GamesPage() {
  const [liveGames, scheduledGames, finalGames] = await Promise.all([
    getGames('live'),
    getGames('scheduled'),
    getGames('final'),
  ])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">NBA 試合一覧</h1>

      {liveGames.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3">
            試合中
          </h2>
          <ul className="flex flex-col gap-3">
            {liveGames.map((game) => (
              <li key={game.id}>
                <GameCard game={game} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {scheduledGames.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            予定
          </h2>
          <ul className="flex flex-col gap-3">
            {scheduledGames.map((game) => (
              <li key={game.id}>
                <GameCard game={game} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {finalGames.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            終了
          </h2>
          <ul className="flex flex-col gap-3">
            {finalGames.map((game) => (
              <li key={game.id}>
                <GameCard game={game} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {liveGames.length === 0 && scheduledGames.length === 0 && finalGames.length === 0 && (
        <p className="text-gray-400 text-center py-16">試合データがありません</p>
      )}
    </main>
  )
}
