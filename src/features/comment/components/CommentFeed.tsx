'use client'

import type { RefObject } from 'react'
import type { Comment } from '../schema'

interface CommentFeedProps {
  comments: Comment[]
  bottomRef: RefObject<HTMLDivElement | null>
}

export function CommentFeed({ comments, bottomRef }: CommentFeedProps) {
  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-1">
        <span className="text-2xl">💬</span>
        <p className="text-sm">最初のコメントを投稿しましょう！</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 overflow-y-auto max-h-[50vh] sm:max-h-[480px] pr-1">
      {comments.map((comment) => (
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
      {/* アバター */}
      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
        {displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-semibold text-gray-800 text-xs">{displayName}</span>
          {username && <span className="text-gray-400 text-xs">@{username}</span>}
          <span className="text-gray-300 text-xs">{time}</span>
        </div>
        <p className="text-gray-700 mt-0.5 break-words leading-relaxed">{comment.content}</p>
      </div>
    </div>
  )
}
