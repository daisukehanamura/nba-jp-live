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
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  })

  return result.success ? result.data : null
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
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  })

  return result.success ? result.data : null
}
