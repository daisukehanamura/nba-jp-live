import { createAdminClient } from '@/lib/supabase/admin'
import { fetchGames, type BallDontLieGame } from '@/lib/balldontlie/client'

// 米国東部時間のDST判定 (EDT: 3月第2日曜 〜 11月第1日曜)
function isEasternDST(date: Date): boolean {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + 1 // 1-12

  if (month < 3 || month > 11) return false
  if (month > 3 && month < 11) return true

  if (month === 3) {
    const march1 = new Date(Date.UTC(year, 2, 1))
    const firstSun = (7 - march1.getUTCDay()) % 7 + 1
    const secondSun = firstSun + 7
    return date.getUTCDate() >= secondSun
  }

  // month === 11
  const nov1 = new Date(Date.UTC(year, 10, 1))
  const firstSun = (7 - nov1.getUTCDay()) % 7 + 1
  return date.getUTCDate() < firstSun
}

// "7:30 pm ET" + "2026-04-04" → UTC ISO文字列
// フォーマットに合わない場合は日付の午前0時UTCにフォールバック
export function parseScheduledAt(dateStr: string, status: string): string {
  const m = status.match(/^(\d{1,2}):(\d{2})\s*(am|pm)\s*ET$/i)
  if (!m) {
    return new Date(`${dateStr}T00:00:00Z`).toISOString()
  }

  let h = parseInt(m[1]!, 10)
  const min = parseInt(m[2]!, 10)
  const ampm = m[3]!.toLowerCase()

  if (ampm === 'pm' && h !== 12) h += 12
  if (ampm === 'am' && h === 12) h = 0

  // EDT = UTC-4, EST = UTC-5
  const dateRef = new Date(`${dateStr}T00:00:00Z`)
  const offsetHours = isEasternDST(dateRef) ? 4 : 5
  const d = new Date(`${dateStr}T00:00:00Z`)
  d.setUTCHours(h + offsetHours, min, 0, 0)
  return d.toISOString()
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
