'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SignUpSchema, type SignUpInput } from '../schema'

const inputClass = 'w-full bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent'
const labelClass = 'block text-xs font-medium text-gray-400 mb-1'

export function SignUpForm() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const raw: SignUpInput = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      username: formData.get('username') as string,
      displayName: formData.get('displayName') as string,
    }

    const result = SignUpSchema.safeParse(raw)
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? '入力内容を確認してください')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        data: {
          username: result.data.username,
          display_name: result.data.displayName,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      window.location.href = '/games'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email" className={labelClass}>メールアドレス</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="example@email.com"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClass}>パスワード（8文字以上）</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="username" className={labelClass}>ユーザー名（英数字・_、3〜20文字）</label>
        <input
          id="username"
          name="username"
          type="text"
          placeholder="nba_fan_123"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="displayName" className={labelClass}>表示名</label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          placeholder="NBAファン"
          required
          className={inputClass}
        />
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-400 text-white rounded-lg px-4 py-2.5 text-sm font-bold disabled:opacity-50 transition-colors mt-1"
      >
        {loading ? '登録中...' : 'アカウントを作成する'}
      </button>
    </form>
  )
}
