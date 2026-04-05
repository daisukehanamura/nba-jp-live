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
      <h1 className="text-2xl font-bold text-gray-900">🏆 予想ランキング</h1>

      {/* 仕組み説明 */}
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col gap-2">
        <p className="text-sm font-bold text-orange-700">ポイントの仕組み</p>
        <ul className="text-sm text-gray-700 flex flex-col gap-1">
          <li>🏀 試合ごとに勝利チームを予測して投票</li>
          <li>🎯 的中するとオッズ × 100pt を獲得</li>
          <li>🔒 ハーフタイム以降は投票締め切り</li>
          <li>⏱ ポイントは試合終了後1時間以内に反映</li>
        </ul>
      </div>

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
                  <span className={`w-7 text-center font-bold text-sm ${medalColors[entry.rank] ?? 'text-gray-700'}`}>
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
                  </span>
                  <Avatar avatarUrl={entry.avatarUrl} displayName={entry.displayName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {entry.displayName}
                      {isMe && <span className="ml-1.5 text-xs text-orange-500 font-bold">YOU</span>}
                    </p>
                    <p className="text-xs text-gray-600">@{entry.username}</p>
                  </div>
                  <span className="font-bold text-blue-600 text-sm">
                    {entry.points.toLocaleString()}
                    <span className="text-xs font-normal text-gray-600 ml-0.5">pt</span>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}
