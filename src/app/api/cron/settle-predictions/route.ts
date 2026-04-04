import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // 未精算のfinal試合を取得
  const { data: games, error } = await supabase
    .from('games')
    .select('id')
    .eq('status', 'final')
    .is('settled_at', null)
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const settled: string[] = []
  for (const game of games ?? []) {
    const { error: rpcError } = await supabase.rpc('settle_game', { p_game_id: game.id })
    if (!rpcError) {
      settled.push(game.id)
    }
  }

  return Response.json({ settled, count: settled.length })
}
