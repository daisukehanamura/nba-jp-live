import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PostCommentSchema } from '@/features/comment/schema'
import { checkRateLimit } from '@/utils/rate-limit'
import { ok, err } from '@/types/api'

// 1分間に10件まで
const RATE_LIMIT = { limit: 10, windowMs: 60_000 }

export async function POST(request: NextRequest) {
  // 認証確認
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(err('ログインが必要です'), { status: 401 })
  }

  // レートリミット（ユーザーID単位）
  const { allowed } = checkRateLimit(`comment:${user.id}`, RATE_LIMIT)
  if (!allowed) {
    return NextResponse.json(
      err('投稿が多すぎます。しばらく待ってから再度お試しください'),
      { status: 429 }
    )
  }

  // バリデーション
  const body: unknown = await request.json()
  const result = PostCommentSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      err(result.error.issues[0]?.message ?? '入力内容を確認してください'),
      { status: 400 }
    )
  }

  const { gameId, content } = result.data

  // DB挿入
  const { data, error } = await supabase
    .from('comments')
    .insert({ game_id: gameId, user_id: user.id, content })
    .select('*, profiles(username, display_name, avatar_url)')
    .single()

  if (error) {
    console.error('Comment insert error:', error)
    return NextResponse.json(err('コメントの投稿に失敗しました'), { status: 500 })
  }

  return NextResponse.json(ok(data), { status: 201 })
}
