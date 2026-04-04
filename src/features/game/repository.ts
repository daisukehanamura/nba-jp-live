import { createClient } from '@/lib/supabase/server'
import { GameSchema, type Game, type GameStatus } from './schema'

function parseGame(row: Record<string, unknown>): Game | null {
  const result = GameSchema.safeParse({
    id: row.id,
    externalId: row.external_id,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeScore: row.home_score,
    awayScore: row.away_score,
    status: row.status,
    scheduledAt: row.scheduled_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
  return result.success ? result.data : null
}

export async function getGames(status?: GameStatus): Promise<Game[]> {
  const supabase = await createClient()

  let query = supabase
    .from('games')
    .select('*')
    .order('scheduled_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error || !data) return []

  return data.flatMap((row) => {
    const game = parseGame(row as Record<string, unknown>)
    return game ? [game] : []
  })
}

export async function getGameById(id: string): Promise<Game | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null

  return parseGame(data as Record<string, unknown>)
}
