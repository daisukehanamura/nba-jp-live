import { Suspense } from 'react'
import { DateNav } from '@/features/game/components/DateNav'
import { GameList } from '@/features/game/components/GameList'
import { GameListSkeleton } from '@/features/game/components/GameListSkeleton'

interface GamesPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const { date } = await searchParams
  // NBAの試合はET夜→JST翌朝放映のため、JST今日-1日がJST今日放映のET日付に対応する
  const jstToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date())
  const d = new Date(`${jstToday}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  const today = d.toISOString().split('T')[0]!
  const currentDate = date ?? today

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">NBA 試合</h1>
      <div className="mb-6">
        <DateNav currentDate={currentDate} />
      </div>
      <Suspense fallback={<GameListSkeleton />}>
        <GameList currentDate={currentDate} isToday={currentDate === today} />
      </Suspense>
    </main>
  )
}
