import Link from 'next/link'
import { getUser } from '@/lib/supabase/server'
import { getProfile } from '@/features/auth/repository'
import { Avatar } from '@/components/Avatar'

export async function Header() {
  const user = await getUser()
  const profile = user ? await getProfile(user.id) : null

  return (
    <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
      <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/games" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-950 border border-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src="/icon-192.svg" alt="" className="w-full h-full" />
            </div>
            <span className="font-extrabold text-base tracking-widest text-orange-400">HOOPMIN</span>
          </Link>
          <Link href="/ranking" className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1">
            🏆 <span>ランキング</span>
          </Link>
        </div>

        {user ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <Avatar avatarUrl={profile?.avatarUrl} displayName={profile?.displayName ?? user.email?.split('@')[0] ?? 'U'} size="sm" />
            <span className="hidden sm:inline">{profile?.displayName ?? 'マイページ'}</span>
          </Link>
        ) : (
          <Link href="/auth/login" className="text-sm text-gray-300 hover:text-white transition-colors">
            ログイン
          </Link>
        )}
      </div>
    </header>
  )
}
