'use client'

import { useRef, useState } from 'react'

interface CommentFormProps {
  gameId: string
}

const STAMPS = [
  { label: '🔥', text: '🔥 ヤバ！' },
  { label: '👏', text: '👏 ナイス！' },
  { label: '🏀', text: '🏀 ナイシュ！' },
  { label: '😱', text: '😱 え！？' },
  { label: '💀', text: '💀 草' },
  { label: '😤', text: '😤 頑張れ！' },
  { label: '🤦', text: '🤦 もったいない' },
  { label: '⚡', text: '⚡ はやっ！' },
]

export function CommentForm({ gameId }: CommentFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function postComment(content: string) {
    if (!content) return

    setError(null)
    setLoading(true)

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, content }),
    })

    const json = await res.json() as { success: boolean; error?: string }

    if (!json.success) {
      setError(json.error ?? '投稿に失敗しました')
    }

    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const content = inputRef.current?.value.trim() ?? ''
    await postComment(content)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleStamp(text: string) {
    await postComment(text)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* スタンプボタン */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {STAMPS.map((stamp) => (
          <button
            key={stamp.label}
            type="button"
            onClick={() => handleStamp(stamp.text)}
            disabled={loading}
            className="flex-shrink-0 text-xl px-2 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-40"
            title={stamp.text}
          >
            {stamp.label}
          </button>
        ))}
      </div>

      {/* テキスト入力 */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-1">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            maxLength={200}
            placeholder="コメントを入力..."
            className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-50 shrink-0"
          >
            送信
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </form>
    </div>
  )
}
