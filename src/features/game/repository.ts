import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { GameSchema, type Game } from './schema'

function parseGame(row: Record<string, unknown>): Game | null {
  const result = GameSchema.safeParse({
    id: row.id,
    externalId: row.external_id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeScore: row.home_score,
    awayScore: row.away_score,
    status: row.status,
    period: row.period ?? 0,
    gameTime: row.game_time ?? '',
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
  return result.success ? result.data : null
}

async function fetchGamesByDate(date: string): Promise<Game[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('game_date', date)
    .order('scheduled_at', { ascending: true })

  if (error || !data) return []

  return data.flatMap((row) => {
    const game = parseGame(row as Record<string, unknown>)
    return game ? [game] : []
  })
}

// 30秒キャッシュ（sync-liveが5分ごとに更新するため十分な鮮度）
export const getGamesByDate = unstable_cache(
  fetchGamesByDate,
  ['games-by-date'],
  { revalidate: 30, tags: ['games'] }
)

async function fetchGameById(id: string): Promise<Game | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return parseGame(data as Record<string, unknown>)
}

// 試合詳細は30秒キャッシュ
export const getGameById = unstable_cache(
  fetchGameById,
  ['game-by-id'],
  { revalidate: 30, tags: ['games'] }
)
