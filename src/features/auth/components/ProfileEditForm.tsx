'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ProfileEditFormProps {
  currentDisplayName: string
}

export function ProfileEditForm({ currentDisplayName }: ProfileEditFormProps) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed || trimmed === currentDisplayName) return

    setStatus('loading')
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: trimmed }),
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={30}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <p className="text-xs text-gray-400 mt-1">{displayName.length} / 30文字</p>
      </div>
      <button
        type="submit"
        disabled={status === 'loading' || displayName.trim() === currentDisplayName}
        className="self-start bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 hover:bg-blue-700 transition-colors"
      >
        {status === 'loading' ? '保存中...' : status === 'success' ? '✓ 保存しました' : '保存'}
      </button>
      {status === 'error' && <p className="text-red-500 text-xs">保存に失敗しました</p>}
    </form>
  )
}
