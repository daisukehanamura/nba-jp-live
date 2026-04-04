import { createClient } from '@/lib/supabase/server'
import { calcOdds, type PredictionSummary } from './schema'

export async function getPredictionSummary(
  gameId: string,
  userId: string | null,
): Promise<PredictionSummary> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('predictions')
    .select('predicted_winner, user_id, odds, points_earned')
    .eq('game_id', gameId)

  const rows = data ?? []
  const homeCount = rows.filter((r) => r.predicted_winner === 'home').length
  const awayCount = rows.filter((r) => r.predicted_winner === 'away').length
  const total = homeCount + awayCount

  // 表示用オッズ（次に投票したらどうなるかを想定）
  const homeOdds = calcOdds(total + 1, homeCount + 1)
  const awayOdds = calcOdds(total + 1, awayCount + 1)

  const userRow = userId ? rows.find((r) => r.user_id === userId) : null
  const userPrediction =
    userRow?.predicted_winner === 'home' || userRow?.predicted_winner === 'away'
      ? userRow.predicted_winner
      : null
  const userOdds = userRow ? Number(userRow.odds) : null
  const userPointsEarned = userRow?.points_earned ?? null

  return { homeCount, awayCount, homeOdds, awayOdds, userPrediction, userOdds, userPointsEarned }
}

export interface UserPredictionHistory {
  gameId: string
  homeTeam: string
  awayTeam: string
  gameStatus: string
  homeScore: number | null
  awayScore: number | null
  predictedWinner: 'home' | 'away'
  odds: number
  pointsEarned: number | null
  createdAt: string
}

export async function getUserPredictions(userId: string): Promise<UserPredictionHistory[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('predictions')
    .select(`
      predicted_winner,
      odds,
      points_earned,
      created_at,
      games (
        id,
        home_team,
        away_team,
        status,
        home_score,
        away_score
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (!data) return []

  return data.map((row) => {
    const game = row.games as unknown as {
      id: string
      home_team: string
      away_team: string
      status: string
      home_score: number | null
      away_score: number | null
    }
    return {
      gameId: game.id,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      gameStatus: game.status,
      homeScore: game.home_score,
      awayScore: game.away_score,
      predictedWinner: row.predicted_winner as 'home' | 'away',
      odds: Number(row.odds),
      pointsEarned: row.points_earned,
      createdAt: row.created_at,
    }
  })
}
