import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { updateProfile, createProfile } from '@/features/auth/repository'
import { ok, err } from '@/types/api'

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(30),
  avatarUrl: z.string().regex(/^preset_[0-5]$/).nullable().optional(),
})

const CreateProfileSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(30),
})

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(err('ログインが必要です'), { status: 401 })
  }

  const body: unknown = await request.json()
  const result = UpdateProfileSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(err('入力内容を確認してください'), { status: 400 })
  }

  const profile = await updateProfile(user.id, result.data.displayName, result.data.avatarUrl ?? null)
  if (!profile) {
    return NextResponse.json(err('更新に失敗しました'), { status: 500 })
  }

  return NextResponse.json(ok(profile))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(err('ログインが必要です'), { status: 401 })
  }

  const body: unknown = await request.json()
  const result = CreateProfileSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(err('入力内容を確認してください'), { status: 400 })
  }

  const profile = await createProfile(user.id, result.data.username, result.data.displayName)
  if (!profile) {
    return NextResponse.json(err('そのユーザー名は既に使われています'), { status: 409 })
  }

  return NextResponse.json(ok(profile))
}
