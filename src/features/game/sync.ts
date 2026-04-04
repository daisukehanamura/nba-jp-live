import { createAdminClient } from '@/lib/supabase/admin'
import { fetchGames, type BallDontLieGame } from '@/lib/balldontlie/client'

// statusがISO UTC文字列 ("2026-04-04T19:00:00Z") の場合はそのまま使用
// それ以外 (Final / Qtr 3 5:23 等) は日付の午前0時UTCにフォールバック
export function parseScheduledAt(dateStr: string, status: string): string {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(status)) {
    return status
  }
  return new Date(`${dateStr}T00:00:00Z`).toISOString()
}

function toGameStatus(apiGame: BallDontLieGame): 'scheduled' | 'live' | 'final' {
  if (apiGame.status === 'Final' || apiGame.status === 'Final/OT') return 'final'
  if (apiGame.period > 0 && apiGame.status !== 'Final') return 'live'
  return 'scheduled'
}

function toDbGame(game: BallDontLieGame) {
  const status = toGameStatus(game)
  const scheduledAt = parseScheduledAt(game.date, game.status)
  return {
    external_id: String(game.id),
    game_date: game.date,           // NBAのET基準日付 (YYYY-MM-DD)
    home_team: game.home_team.full_name,
    away_team: game.visitor_team.full_name,
    home_score: status !== 'scheduled' ? game.home_team_score : null,
    away_score: status !== 'scheduled' ? game.visitor_team_score : null,
    status,
    scheduled_at: scheduledAt,
    started_at: status !== 'scheduled' ? scheduledAt : null,
    ended_at: status === 'final' ? scheduledAt : null,
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

export function getDefaultDateRange() {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 1)
  const end = new Date(now)
  end.setDate(end.getDate() + 14)

  return {
    startDate: start.toISOString().split('T')[0]!,
    endDate: end.toISOString().split('T')[0]!,
  }
}

export function getHistoricalDateRange(monthsAgo: number) {
  const now = new Date()
  const start = new Date(now)
  start.setMonth(start.getMonth() - monthsAgo)
  start.setDate(1)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setDate(0)

  return {
    startDate: start.toISOString().split('T')[0]!,
    endDate: end.toISOString().split('T')[0]!,
  }
}
