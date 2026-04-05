'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AVATAR_PRESETS } from '@/utils/avatar'

interface ProfileEditFormProps {
  currentDisplayName: string
  currentAvatarUrl: string | null
}

export function ProfileEditForm({ currentDisplayName, currentAvatarUrl }: ProfileEditFormProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl ?? '')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const isDirty = displayName.trim() !== currentDisplayName || avatarUrl !== (currentAvatarUrl ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed || !isDirty) return

    setStatus('loading')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: trimmed, avatarUrl: avatarUrl || null }),
    })
    const json = await res.json() as { success: boolean }

    if (json.success) {
      setStatus('success')
      router.refresh()
      setTimeout(() => setStatus('idle'), 2000)
    } else {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* アバター選択 */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3">アバター</label>
        <div className="flex gap-3 flex-wrap">
          {AVATAR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setAvatarUrl(preset.id)}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${preset.bg} ${
                avatarUrl === preset.id
                  ? 'ring-4 ring-blue-500 ring-offset-2 scale-110'
                  : 'opacity-60 hover:opacity-100 hover:scale-105'
              }`}
            >
              {preset.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* 表示名 */}
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">表示名</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={30}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
        <p className="text-xs text-gray-600 mt-1">{displayName.length} / 30文字</p>
      </div>

      <button
        type="submit"
        disabled={status === 'loading' || !isDirty}
        className="self-start bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
      >
        {status === 'loading' ? '保存中...' : status === 'success' ? '✓ 保存しました' : '保存'}
      </button>
      {status === 'error' && <p className="text-red-500 text-xs">保存に失敗しました</p>}
    </form>
  )
}
