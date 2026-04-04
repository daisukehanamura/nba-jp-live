'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CommentSchema, type Comment } from '../schema'

export function useComments(gameId: string, initialComments: Comment[]) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const receivedIds = useRef<Set<string>>(new Set(initialComments.map((c) => c.id)))

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`comments:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `game_id=eq.${gameId}`,
        },
        async (payload) => {
          const id = payload.new['id'] as string

          // 自分の投稿（楽観的更新済み or 既受信）はスキップ
          if (receivedIds.current.has(id)) return
          receivedIds.current.add(id)

          const { data: profile } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', payload.new['user_id'])
            .single()

          const result = CommentSchema.safeParse({
            id,
            gameId: payload.new['game_id'],
            userId: payload.new['user_id'],
            content: payload.new['content'],
            createdAt: payload.new['created_at'],
            profile: profile
              ? {
                  username: profile.username,
                  displayName: profile.display_name,
                  avatarUrl: profile.avatar_url ?? null,
                }
              : undefined,
          })

          if (result.success) {
            setComments((prev) => [...prev, result.data])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  // 楽観的にコメントを追加し、後で本物のIDに差し替えられるよう仮IDを返す
  function addOptimistic(comment: Comment) {
    setComments((prev) => [...prev, comment])
  }

  // 楽観的コメント（仮ID）を本物のIDに差し替える
  function confirmOptimistic(tempId: string, realId: string) {
    receivedIds.current.add(realId) // Realtimeで重複しないようにマーク
    setComments((prev) =>
      prev.map((c) => (c.id === tempId ? { ...c, id: realId } : c))
    )
  }

  return { comments, bottomRef, addOptimistic, confirmOptimistic }
}
