import { createClient } from '@/lib/supabase/server'
import { ProfileSchema, type Profile } from './schema'

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !data) return null

  const result = ProfileSchema.safeParse({
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    points: data.points ?? 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  })

  return result.success ? result.data : null
}

export async function updateProfile(
  userId: string,
  displayName: string,
  avatarUrl: string | null = null,
): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName, avatar_url: avatarUrl })
    .eq('id', userId)
    .select()
    .single()

  if (error || !data) return null

  const result = ProfileSchema.safeParse({
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    points: data.points ?? 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  })

  return result.success ? result.data : null
}

export interface RankingEntry {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  points: number
  rank: number
}

export async function getRanking(limit = 50): Promise<RankingEntry[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, points')
    .order('points', { ascending: false })
    .limit(limit)

  if (!data) return []

  return data.map((row, index) => ({
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    points: row.points ?? 0,
    rank: index + 1,
  }))
}

export async function createProfile(
  userId: string,
  username: string,
  displayName: string
): Promise<Profile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .insert({ id: userId, username, display_name: displayName })
    .select()
    .single()

  if (error || !data) return null

  const result = ProfileSchema.safeParse({
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    points: data.points ?? 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  })

  return result.success ? result.data : null
}
