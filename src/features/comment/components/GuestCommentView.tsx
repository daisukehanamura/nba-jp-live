import Link from 'next/link'
import type { Comment } from '../schema'

interface GuestCommentViewProps {
  gameId: string
  initialComments: Comment[]
}

export function GuestCommentView({ initialComments }: GuestCommentViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
        コメント
      </h2>

      {/* コメント一覧（読み取り専用） */}
      {initialComments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-600 gap-1">
          <span className="text-2xl">💬</span>
          <p className="text-sm">まだコメントはありません</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[40vh] sm:max-h-[360px] pr-1">
          {initialComments.slice(-50).map((comment) => {
            const displayName = comment.profile?.displayName ?? '名無し'
            const username = comment.profile?.username
            const time = new Date(comment.createdAt).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'Asia/Tokyo',
            })
            return (
              <div key={comment.id} className="flex gap-2.5 text-sm">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {displayName.charAt(0).toUpperCase()}
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
          })}
        </div>
      )}

      {/* 参加誘導バナー */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-orange-50 border border-gray-200 px-4 py-4 flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-gray-900">
          🏀 盛り上がりに参加しよう！
        </p>
        <p className="text-xs text-gray-600">
          ログインすると絵文字スタンプや勝利予測ができます
        </p>
        <div className="flex gap-2 mt-1">
          <Link
            href="/auth/signup"
            className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            無料登録
          </Link>
          <Link
            href="/auth/login"
            className="bg-white text-gray-700 text-xs font-medium px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            ログイン
          </Link>
        </div>
      </div>
    </div>
  )
}
