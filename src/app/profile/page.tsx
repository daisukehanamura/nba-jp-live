import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/features/auth/repository'
import { ProfileEditForm } from '@/features/auth/components/ProfileEditForm'
import { LogoutButton } from '@/features/auth/components/LogoutButton'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const profile = await getProfile(user.id)
  if (!profile) redirect('/auth/login')

  const { data: recentComments } = await supabase
    .from('comments')
    .select('*, games(home_team, away_team, scheduled_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const joinedAt = new Date(profile.createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">マイページ</h1>

      {/* プロフィールカード */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold shrink-0">
            {profile.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-lg text-gray-900">{profile.displayName}</p>
            <p className="text-sm text-gray-600">@{profile.username}</p>
            <p className="text-xs text-gray-500 mt-0.5">{joinedAt} 登録</p>
          </div>
        </div>

        <ProfileEditForm currentDisplayName={profile.displayName} />
      </div>

      {/* 最近のコメント */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
        <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-4">
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
                  <p className="text-xs text-gray-500 mt-1">
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
        <h2 className="font-semibold text-sm text-gray-700 uppercase tracking-wide mb-4">
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
