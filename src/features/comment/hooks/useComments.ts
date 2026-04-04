'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CommentSchema, type Comment } from '../schema'

const SCROLL_THRESHOLD = 80 // px from bottom to consider "at bottom"

export function useComments(gameId: string, initialComments: Comment[]) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [unreadCount, setUnreadCount] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const receivedIds = useRef<Set<string>>(new Set(initialComments.map((c) => c.id)))
  const isAtBottomRef = useRef(true)

  // スクロール位置を監視
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    function handleScroll() {
      const { scrollTop, scrollHeight, clientHeight } = container!
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD
      if (isAtBottomRef.current) {
        setUnreadCount(0)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // 最下部にいるときだけ自動スクロール
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments.length])

  // Realtime購読
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
            if (!isAtBottomRef.current) {
              setUnreadCount((n) => n + 1)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  function scrollToLatest() {
    isAtBottomRef.current = true
    setUnreadCount(0)
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function addOptimistic(comment: Comment) {
    setComments((prev) => [...prev, comment])
  }

  function confirmOptimistic(tempId: string, realId: string) {
    receivedIds.current.add(realId)
    setComments((prev) =>
      prev.map((c) => (c.id === tempId ? { ...c, id: realId } : c))
    )
  }

  return {
    comments,
    unreadCount,
    scrollContainerRef,
    bottomRef,
    scrollToLatest,
    addOptimistic,
    confirmOptimistic,
  }
}
