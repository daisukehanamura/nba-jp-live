import { createClient } from '@/lib/supabase/server'
import { PostPredictionSchema, calcOdds } from '@/features/prediction/schema'
import { ok, err } from '@/types/api'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json(err('ログインが必要です'), { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const validation = PostPredictionSchema.safeParse(body)
  if (!validation.success) {
    return Response.json(err(validation.error.issues[0]?.message ?? '入力エラー'), { status: 400 })
  }

  const { gameId, predictedWinner } = validation.data

  // 現在の投票数を取得してオッズ計算
  const { data: existing } = await supabase
    .from('predictions')
    .select('predicted_winner')
    .eq('game_id', gameId)

  const rows = existing ?? []
  const homeCount = rows.filter((r) => r.predicted_winner === 'home').length
  const awayCount = rows.filter((r) => r.predicted_winner === 'away').length
  const total = homeCount + awayCount

  const chosenAfter = predictedWinner === 'home' ? homeCount + 1 : awayCount + 1
  const odds = calcOdds(total + 1, chosenAfter)

  const { error: dbError } = await supabase
    .from('predictions')
    .insert({ game_id: gameId, user_id: user.id, predicted_winner: predictedWinner, odds })

  if (dbError) {
    if (dbError.code === '23505') {
      return Response.json(err('すでに予測済みです'), { status: 409 })
    }
    return Response.json(err('投稿に失敗しました'), { status: 500 })
  }

  return Response.json(ok({ odds }), { status: 201 })
}
