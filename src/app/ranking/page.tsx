import { createClient } from '@/lib/supabase/server'
import { getRanking } from '@/features/auth/repository'
import { Avatar } from '@/components/Avatar'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const ranking = await getRanking(50)

  const medalColors: Record<number, string> = {
    1: 'text-yellow-500',
    2: 'text-gray-400',
    3: 'text-amber-600',
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold text-gray-900">予想ランキング</h1>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {ranking.length === 0 ? (
          <p className="text-sm text-gray-600 p-6">まだランキングデータがありません</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {ranking.map((entry) => {
              const isMe = user?.id === entry.id
              return (
                <li
                  key={entry.id}
                  className={`flex items-center gap-3 px-4 py-3 ${isMe ? 'bg-orange-50' : ''}`}
                >
                  <span className={`w-7 text-center font-bold text-sm ${medalColors[entry.rank] ?? 'text-gray-500'}`}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                  </span>
                  <Avatar avatarUrl={entry.avatarUrl} displayName={entry.displayName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {entry.displayName}
                      {isMe && <span className="ml-1.5 text-xs text-orange-500 font-bold">YOU</span>}
                    </p>
                    <p className="text-xs text-gray-500">@{entry.username}</p>
                  </div>
                  <span className="font-bold text-blue-600 text-sm">{entry.points.toLocaleString()}<span className="text-xs font-normal text-gray-500 ml-0.5">pt</span></span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
