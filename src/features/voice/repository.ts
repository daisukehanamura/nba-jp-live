import { AccessToken } from 'livekit-server-sdk'

export async function getVoiceParticipantCounts(gameIds: string[]): Promise<Record<string, number>> {
  if (gameIds.length === 0) return {}

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!.replace('wss://', 'https://')
  const apiKey = process.env.LIVEKIT_API_KEY!
  const apiSecret = process.env.LIVEKIT_API_SECRET!

  const listToken = new AccessToken(apiKey, apiSecret, { ttl: 10 })
  listToken.addGrant({ roomList: true })
  const jwt = await listToken.toJwt()

  const results = await Promise.all(
    gameIds.map(async (gameId) => {
      const res = await fetch(`${livekitUrl}/twirp/livekit.RoomService/ListParticipants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ room: `game-${gameId}` }),
        cache: 'no-store',
      })
      if (!res.ok) return [gameId, 0] as const
      const data = await res.json() as { participants?: unknown[] }
      return [gameId, data.participants?.length ?? 0] as const
    })
  )

  return Object.fromEntries(results) as Record<string, number>
}
