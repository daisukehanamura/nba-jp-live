import { NextRequest, NextResponse } from 'next/server'
import { syncGames, getDefaultDateRange } from '@/features/game/sync'
import { ok, err } from '@/types/api'

// Vercel Cron から呼ばれる。CRON_SECRET で不正アクセスを防ぐ
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(err('Unauthorized'), { status: 401 })
  }

  try {
    const { startDate, endDate } = getDefaultDateRange()
    const result = await syncGames(startDate, endDate)
    return NextResponse.json(ok(result))
  } catch (e) {
    console.error('sync-games error:', e)
    return NextResponse.json(err('同期に失敗しました'), { status: 500 })
  }
}
