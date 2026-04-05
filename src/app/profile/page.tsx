import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/features/auth/repository'
import { getUserPredictions } from '@/features/prediction/repository'
import { ProfileEditForm } from '@/features/auth/components/ProfileEditForm'
import { LogoutButton } from '@/features/auth/components/LogoutButton'
import { Avatar } from '@/components/Avatar'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  // profileがなくてもページは表示する（作成されていない場合のフォールバック）
  const displayName = profile?.displayName ?? user.email?.split('@')[0] ?? 'ユーザー'
  const username = profile?.username ?? ''

  const [{ data: recentComments }, predictionHistory] = await Promise.all([
    supabase
      .from('comments')
      .select('*, games(home_team, away_team, scheduled_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    getUserPredictions(user.id),
  ])

  const joinedAt = profile ? new Date(profile.createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  }) : ''

  const correctCount = predictionHistory.filter((p) => p.pointsEarned && p.pointsEarned > 0).length
  const settledCount = predictionHistory.filter((p) => p.pointsEarned !== null).length
  const points = profile?.points ?? 0

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">
      <h1 className="text-xl font-bold">マイページ</h1>

      {/* プロフィールカード */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <Avatar avatarUrl={profile?.avatarUrl} displayName={displayName} size="lg" />
          <div>
            <p className="font-bold text-lg text-gray-900">{displayName}</p>
            {username && <p className="text-sm text-gray-600">@{username}</p>}
            {joinedAt && <p className="text-xs text-gray-600 mt-0.5">{joinedAt} 登録</p>}
          </div>
        </div>

        <ProfileEditForm currentDisplayName={displayName} currentAvatarUrl={profile?.avatarUrl ?? null} />
      </div>

      {/* ポイント・予測成績 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-sm text-gray-600 uppercase tracking-wide mb-4">
          予測成績
        </h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="flex flex-col items-center bg-blue-50 rounded-xl p-4">
            <span className="text-2xl font-bold text-blue-600">{points.toLocaleString()}</span>
            <span className="text-xs text-gray-600 mt-0.5">総ポイント</span>
          </div>
          <div className="flex flex-col items-center bg-gray-50 rounded-xl p-4">
            <span className="text-2xl font-bold text-gray-900">{predictionHistory.length}</span>
            <span className="text-xs text-gray-600 mt-0.5">予測回数</span>
          </div>
          <div className="flex flex-col items-center bg-green-50 rounded-xl p-4">
            <span className="text-2xl font-bold text-green-600">
              {settledCount > 0 ? Math.round((correctCount / settledCount) * 100) : 0}%
            </span>
            <span className="text-xs text-gray-600 mt-0.5">的中率</span>
          </div>
        </div>

        {/* 予測履歴 */}
        {predictionHistory.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {predictionHistory.map((p) => {
              const pickedTeam = p.predictedWinner === 'away' ? p.awayTeam : p.homeTeam
              const isCorrect = p.pointsEarned !== null && p.pointsEarned > 0
              const isWrong = p.pointsEarned === 0
              const isPending = p.pointsEarned === null && p.gameStatus === 'final'
              return (
                <li key={`${p.gameId}-${p.createdAt}`} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-gray-600">{p.awayTeam} vs {p.homeTeam}</span>
                    <span className="text-gray-900 font-medium">{pickedTeam} × {p.odds.toFixed(1)}倍</span>
                  </div>
                  <div className="text-right">
                    {isCorrect && (
                      <span className="text-green-600 font-bold">+{p.pointsEarned}pt</span>
                    )}
                    {isWrong && (
                      <span className="text-gray-500">はずれ</span>
                    )}
                    {isPending && (
                      <span className="text-gray-500">精算待ち</span>
                    )}
                    {p.pointsEarned === null && p.gameStatus !== 'final' && (
                      <span className="text-blue-500">予測中</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">まだ予測がありません</p>
        )}
      </div>

      {/* 最近のコメント */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-sm text-gray-600 uppercase tracking-wide mb-4">
          最近のコメント
        </h2>
        {recentComments && recentComments.length > 0 ? (
          <ul className="flex flex-col gap-4">
            {recentComments.map((c) => {
              const game = c.games as { home_team: string; away_team: string; scheduled_at: string } | null
              return (
                <li key={c.id} className="text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  {game && (
                    <p className="text-xs text-gray-600 font-medium mb-0.5">
                      {game.away_team} vs {game.home_team}
                    </p>
                  )}
                  <p className="text-gray-800">{c.content}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(c.created_at).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                  </p>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">まだコメントがありません</p>
        )}
      </div>

      {/* アカウント */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-semibold text-sm text-gray-600 uppercase tracking-wide mb-4">
          アカウント
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">{user.email}</p>
          <LogoutButton />
        </div>
      </div>
    </main>
  )
}
