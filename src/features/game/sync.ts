import { createAdminClient } from '@/lib/supabase/admin'
import { fetchGames, type BallDontLieGame } from '@/lib/balldontlie/client'

// balldontlie のステータスを DB の game_status に変換
function toGameStatus(apiGame: BallDontLieGame): 'scheduled' | 'live' | 'final' {
  if (apiGame.status === 'Final' || apiGame.status === 'Final/OT') return 'final'
  if (apiGame.period > 0 && apiGame.status !== 'Final') return 'live'
  return 'scheduled'
}

function toDbGame(game: BallDontLieGame) {
  const status = toGameStatus(game)
  return {
    external_id: String(game.id),
    home_team: game.home_team.full_name,
    away_team: game.visitor_team.full_name,
    home_score: status !== 'scheduled' ? game.home_team_score : null,
    away_score: status !== 'scheduled' ? game.visitor_team_score : null,
    status,
    scheduled_at: new Date(game.date).toISOString(),
    started_at: status !== 'scheduled' ? new Date(game.date).toISOString() : null,
    ended_at: status === 'final' ? new Date(game.date).toISOString() : null,
  }
}

export async function syncGames(startDate: string, endDate: string) {
  const games = await fetchGames({ start_date: startDate, end_date: endDate })

  if (games.length === 0) return { synced: 0 }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('games')
    .upsert(games.map(toDbGame), { onConflict: 'external_id' })

  if (error) throw new Error(`Supabase upsert error: ${error.message}`)

  return { synced: games.length }
}

// 過去6ヶ月〜未来1ヶ月を同期
export function getDefaultDateRange() {
  const now = new Date()
  const start = new Date(now)
  start.setMonth(start.getMonth() - 6)
  const end = new Date(now)
  end.setMonth(end.getMonth() + 1)

  return {
    startDate: start.toISOString().split('T')[0]!,
    endDate: end.toISOString().split('T')[0]!,
  }
}
