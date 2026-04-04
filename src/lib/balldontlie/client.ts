const BASE_URL = 'https://api.balldontlie.io/v1'

function getHeaders() {
  return {
    Authorization: process.env.BALLDONTLIE_API_KEY ?? '',
  }
}

export interface BallDontLieGame {
  id: number
  date: string
  home_team: { full_name: string }
  visitor_team: { full_name: string }
  home_team_score: number
  visitor_team_score: number
  status: string  // 'Final' | '7:30 pm ET' | 'Qtr 3 5:23' 等
  period: number
  time: string
}

interface GamesResponse {
  data: BallDontLieGame[]
  meta: { next_cursor?: number; per_page: number }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchGames(params: {
  start_date: string  // YYYY-MM-DD
  end_date: string
  per_page?: number
  cursor?: number
}): Promise<BallDontLieGame[]> {
  const query = new URLSearchParams({
    start_date: params.start_date,
    end_date: params.end_date,
    per_page: String(params.per_page ?? 100),
    ...(params.cursor ? { cursor: String(params.cursor) } : {}),
  })

  const res = await fetch(`${BASE_URL}/games?${query}`, {
    headers: getHeaders(),
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    throw new Error(`balldontlie API error: ${res.status}`)
  }

  const json = await res.json() as GamesResponse

  // ページネーション: 次のカーソルがあれば1秒待ってから取得（レートリミット対策）
  if (json.meta.next_cursor) {
    await sleep(1000)
    const next = await fetchGames({ ...params, cursor: json.meta.next_cursor })
    return [...json.data, ...next]
  }

  return json.data
}
