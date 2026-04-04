import { NextRequest, NextResponse } from 'next/server'
import { syncLiveGames } from '@/features/game/sync'
import { ok, err } from '@/types/api'

// 5分ごとに実行。今日・昨日の試合スコアをリアルタイム更新する
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(err('Unauthorized'), { status: 401 })
  }

  try {
    const result = await syncLiveGames()
    return NextResponse.json(ok(result))
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json(err(message), { status: 500 })
  }
}
