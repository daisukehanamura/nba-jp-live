import { createClient } from '@/lib/supabase/server'
import type { PredictionSummary } from './schema'

export async function getPredictionSummary(
  gameId: string,
  userId: string | null,
): Promise<PredictionSummary> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('predictions')
    .select('predicted_winner, user_id')
    .eq('game_id', gameId)

  const rows = data ?? []
  const homeCount = rows.filter((r) => r.predicted_winner === 'home').length
  const awayCount = rows.filter((r) => r.predicted_winner === 'away').length
  const userRow = userId ? rows.find((r) => r.user_id === userId) : null
  const userPrediction =
    userRow?.predicted_winner === 'home' || userRow?.predicted_winner === 'away'
      ? userRow.predicted_winner
      : null

  return { homeCount, awayCount, userPrediction }
}
