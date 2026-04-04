import { NextRequest, NextResponse } from 'next/server'
import { syncGames, getHistoricalDateRange } from '@/features/game/sync'
import { ok, err } from '@/types/api'

// 過去データを月単位で1ヶ月分だけ取得する
// 使い方: GET /api/cron/sync-games-historical?months_ago=1
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(err('Unauthorized'), { status: 401 })
  }

  const monthsAgo = Number(request.nextUrl.searchParams.get('months_ago') ?? '1')

  try {
    const { startDate, endDate } = getHistoricalDateRange(monthsAgo)
    const result = await syncGames(startDate, endDate)
    return NextResponse.json(ok({ ...result, startDate, endDate }))
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('sync-games-historical error:', e)
    return NextResponse.json(err(message), { status: 500 })
  }
}
