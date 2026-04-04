'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CommentSchema, type Comment } from '../schema'

export function useComments(gameId: string, initialComments: Comment[]) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  // Realtime で受信済みのIDを追跡（オプティミスティック重複防止）
  const receivedIds = useRef<Set<string>>(new Set(initialComments.map((c) => c.id)))

  // コメントが増えたら最下部にスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  // Supabase Realtime 購読
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

          // すでに楽観的に追加済みのコメントは無視
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

  // 楽観的にコメントを追加する関数
  function addOptimistic(comment: Comment) {
    receivedIds.current.add(comment.id)
    setComments((prev) => [...prev, comment])
  }

  return { comments, bottomRef, addOptimistic }
}
