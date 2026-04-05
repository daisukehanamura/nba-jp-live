import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { updateProfile } from '@/features/auth/repository'
import { ok, err } from '@/types/api'

const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(30),
  avatarUrl: z.string().regex(/^preset_[0-5]$/).nullable().optional(),
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
