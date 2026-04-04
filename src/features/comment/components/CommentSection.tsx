'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useComments } from '../hooks/useComments'
import { CommentFeed } from './CommentFeed'
import { PostCommentSchema, type Comment } from '../schema'

interface CommentSectionProps {
  gameId: string
  initialComments: Comment[]
  currentUserId: string
  currentUserProfile: {
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export function CommentSection({
  gameId,
  initialComments,
  currentUserId,
  currentUserProfile,
}: CommentSectionProps) {
  const { comments, bottomRef, addOptimistic, confirmOptimistic } = useComments(gameId, initialComments)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const content = inputRef.current?.value.trim() ?? ''
    if (!content || loading) return

    const validation = PostCommentSchema.safeParse({ gameId, content })
    if (!validation.success) {
      setError(validation.error.issues[0]?.message ?? '入力内容を確認してください')
      return
    }

    setError(null)
    setLoading(true)

    // 楽観的更新: 仮IDで即時表示
    const tempId = crypto.randomUUID()
    addOptimistic({
      id: tempId,
      gameId,
      userId: currentUserId,
      content,
      createdAt: new Date().toISOString(),
      profile: currentUserProfile,
    })

    if (inputRef.current) inputRef.current.value = ''

    // DBに挿入して本物のIDを取得
    const supabase = createClient()
    const { data, error: dbError } = await supabase
      .from('comments')
      .insert({ game_id: gameId, user_id: currentUserId, content })
      .select('id')
      .single()

    if (dbError || !data) {
      setError('投稿に失敗しました。もう一度お試しください')
    } else {
      // 仮IDを本物のIDに差し替え（Realtimeの重複も防止）
      confirmOptimistic(tempId, data.id)
    }

    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        コメント
      </h2>
      <CommentFeed comments={comments} bottomRef={bottomRef} />
      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            maxLength={200}
            placeholder="コメントを入力..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 shrink-0 hover:bg-blue-700 transition-colors"
          >
            送信
          </button>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </form>
    </div>
  )
}
