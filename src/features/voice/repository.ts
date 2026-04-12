import { AccessToken } from 'livekit-server-sdk'

type LiveKitRoom = {
  name: string
  numParticipants: number
}

export async function getVoiceParticipantCounts(gameIds: string[]): Promise<Record<string, number>> {
  if (gameIds.length === 0) return {}

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!.replace('wss://', 'https://')
  const apiKey = process.env.LIVEKIT_API_KEY!
  const apiSecret = process.env.LIVEKIT_API_SECRET!

  const listToken = new AccessToken(apiKey, apiSecret, { ttl: 10 })
  listToken.addGrant({ roomList: true })
  const jwt = await listToken.toJwt()

  // ListRooms を1回呼んで全ルームをまとめて取得（N回→1回）
  const res = await fetch(`${livekitUrl}/twirp/livekit.RoomService/ListRooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({}),
    cache: 'no-store',
  })

  if (!res.ok) return {}

  const data = await res.json() as { rooms?: LiveKitRoom[] }
  const rooms = data.rooms ?? []

  // game-{id} のルーム名から参加人数を引く
  const counts: Record<string, number> = {}
  for (const gameId of gameIds) {
    const room = rooms.find((r) => r.name === `game-${gameId}`)
    counts[gameId] = room?.numParticipants ?? 0
  }
  return counts
}
