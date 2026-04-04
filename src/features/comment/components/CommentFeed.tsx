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
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        まだコメントがありません。最初のコメントを投稿しましょう！
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-[480px] pr-1">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}

function CommentItem({ comment }: { comment: Comment }) {
  const displayName = comment.profile?.displayName ?? '名無し'
  const username = comment.profile?.username ?? ''
  const time = new Date(comment.createdAt).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo',
  })

  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-400 shrink-0 pt-0.5">{time}</span>
      <div>
        <span className="font-semibold text-blue-600 mr-1">{displayName}</span>
        {username && (
          <span className="text-gray-400 text-xs mr-1">@{username}</span>
        )}
        <span className="text-gray-800">{comment.content}</span>
      </div>
    </div>
  )
}
