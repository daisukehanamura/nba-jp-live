import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/features/auth/repository'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = user ? await getProfile(user.id) : null

  return (
    <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
      <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/games" className="font-bold text-base tracking-tight text-white flex items-center gap-2">
          🏀 <span>Courtside JP</span>
        </Link>

        {profile ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline">{profile.displayName}</span>
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
