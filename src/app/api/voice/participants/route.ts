import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'

export async function GET(request: NextRequest) {
  const gameId = request.nextUrl.searchParams.get('gameId')
  if (!gameId) {
    return NextResponse.json({ count: 0 })
  }

  const roomName = `game-${gameId}`
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!.replace('wss://', 'https://')
  const apiKey = process.env.LIVEKIT_API_KEY!
  const apiSecret = process.env.LIVEKIT_API_SECRET!

  const listToken = new AccessToken(apiKey, apiSecret, { ttl: 10 })
  listToken.addGrant({ roomList: true })

  const res = await fetch(`${livekitUrl}/twirp/livekit.RoomService/ListParticipants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await listToken.toJwt()}`,
    },
    body: JSON.stringify({ room: roomName }),
  })

  if (!res.ok) return NextResponse.json({ count: 0 })

  const data = await res.json() as { participants?: unknown[] }
  return NextResponse.json({ count: data.participants?.length ?? 0 })
}
