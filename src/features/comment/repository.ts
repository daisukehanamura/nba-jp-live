import { createClient } from '@/lib/supabase/server'
import { CommentSchema, type Comment } from './schema'

function parseComment(row: Record<string, unknown>): Comment | null {
  const profile = row.profiles as Record<string, unknown> | null

  const result = CommentSchema.safeParse({
    id: row.id,
    gameId: row.game_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    profile: profile
      ? {
          username: profile.username,
          displayName: profile.display_name,
          avatarUrl: profile.avatar_url ?? null,
        }
      : undefined,
  })

  return result.success ? result.data : null
}

export async function getComments(gameId: string): Promise<Comment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(username, display_name, avatar_url)')
    .eq('game_id', gameId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error || !data) return []

  return data.flatMap((row) => {
    const comment = parseComment(row as Record<string, unknown>)
    return comment ? [comment] : []
  })
}
