'use client'

import { useState, type RefObject } from 'react'
import { Avatar } from '@/components/Avatar'
import type { Comment } from '../schema'

const INITIAL_VISIBLE = 50

interface CommentFeedProps {
  comments: Comment[]
  scrollContainerRef: RefObject<HTMLDivElement | null>
  bottomRef: RefObject<HTMLDivElement | null>
}

export function CommentFeed({ comments, scrollContainerRef, bottomRef }: CommentFeedProps) {
  const [showAll, setShowAll] = useState(false)

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-600 gap-1">
        <span className="text-2xl">💬</span>
        <p className="text-sm">最初のコメントを投稿しましょう！</p>
      </div>
    )
  }

  const hasMore = comments.length > INITIAL_VISIBLE
  const displayed = showAll ? comments : comments.slice(-INITIAL_VISIBLE)

  return (
    <div
      ref={scrollContainerRef}
      className="flex flex-col gap-3 overflow-y-auto max-h-[50vh] sm:max-h-[480px] pr-1"
    >
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-blue-500 hover:underline py-1 text-center"
        >
          過去 {comments.length - INITIAL_VISIBLE} 件のコメントを見る
        </button>
      )}
      {displayed.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  const displayName = comment.profile?.displayName ?? '名無し'
  const username = comment.profile?.username
  const time = new Date(comment.createdAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  })

  return (
    <div className="flex gap-2.5 text-sm">
      <div className="mt-0.5">
        <Avatar avatarUrl={comment.profile?.avatarUrl} displayName={displayName} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-semibold text-gray-800 text-xs">{displayName}</span>
          {username && <span className="text-gray-600 text-xs">@{username}</span>}
          <span className="text-gray-400 text-xs">{time}</span>
        </div>
        <p className="text-gray-700 mt-0.5 break-words leading-relaxed">{comment.content}</p>
      </div>
    </div>
  )
}
