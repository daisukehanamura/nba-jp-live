import { createClient } from '@/lib/supabase/server'
import { PostPredictionSchema, calcOdds } from '@/features/prediction/schema'
import { ok, err } from '@/types/api'

type FinishedGame = {
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
}

function getWinPct(games: FinishedGame[], team: string): number {
  const teamGames = games.filter((g) => g.home_team === team || g.away_team === team)
  if (teamGames.length === 0) return 0.5
  const wins = teamGames.filter(
    (g) =>
      (g.home_team === team && (g.home_score ?? 0) > (g.away_score ?? 0)) ||
      (g.away_team === team && (g.away_score ?? 0) > (g.home_score ?? 0)),
  ).length
  return wins / teamGames.length
}

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

  // 試合情報取得（締め切りチェック・点差計算用）
  const { data: gameRow } = await supabase
    .from('games')
    .select('status, period, home_score, away_score, home_team, away_team')
    .eq('id', gameId)
    .single()

  if (!gameRow) {
    return Response.json(err('試合が見つかりません'), { status: 404 })
  }

  // ハーフタイム締め切り: Q3以降（period >= 3）は予測不可
  if (gameRow.status === 'live' && gameRow.period >= 3) {
    return Response.json(err('ハーフタイムを過ぎているため予測を締め切りました'), { status: 403 })
  }

  // 現在の投票数を取得
  const { data: existing } = await supabase
    .from('predictions')
    .select('predicted_winner')
    .eq('game_id', gameId)

  const rows = existing ?? []
  const homeCount = rows.filter((r) => r.predicted_winner === 'home').length
  const awayCount = rows.filter((r) => r.predicted_winner === 'away').length
  const total = homeCount + awayCount
  const chosenAfter = predictedWinner === 'home' ? homeCount + 1 : awayCount + 1

  // 順位ファクター: DB内の過去試合から両チームの勝率を計算
  const { data: finishedGames } = await supabase
    .from('games')
    .select('home_team, away_team, home_score, away_score')
    .eq('status', 'final')
    .not('home_score', 'is', null)
    .or(
      `home_team.eq.${gameRow.home_team},away_team.eq.${gameRow.home_team},` +
      `home_team.eq.${gameRow.away_team},away_team.eq.${gameRow.away_team}`,
    )

  const homeWinPct = getWinPct((finishedGames ?? []) as FinishedGame[], gameRow.home_team)
  const awayWinPct = getWinPct((finishedGames ?? []) as FinishedGame[], gameRow.away_team)
  const chosenWinPct = predictedWinner === 'home' ? homeWinPct : awayWinPct
  const opponentWinPct = predictedWinner === 'home' ? awayWinPct : homeWinPct

  // 弱チームを選ぶほどオッズが高くなる（0.4〜2.5倍の範囲でクランプ）
  const rankFactor = Math.max(0.4, Math.min(2.5, (opponentWinPct || 0.5) / (chosenWinPct || 0.5)))

  // 点差ファクター: ライブ時のみ
  // diff = 選択チームのスコア - 相手チームのスコア
  // +40点リード → 0.5倍、-40点ビハインド → 2.0倍
  let scoreFactor = 1.0
  if (
    gameRow.status === 'live' &&
    gameRow.home_score !== null &&
    gameRow.away_score !== null
  ) {
    const chosenScore = predictedWinner === 'home' ? gameRow.home_score : gameRow.away_score
    const opponentScore = predictedWinner === 'home' ? gameRow.away_score : gameRow.home_score
    const diff = chosenScore - opponentScore
    scoreFactor = Math.max(0.5, Math.min(2.0, 1.0 - diff / 40))
  }

  const odds = calcOdds(total + 1, chosenAfter, rankFactor, scoreFactor)

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
