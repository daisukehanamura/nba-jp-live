import { NextRequest, NextResponse } from 'next/server'
import { AccessToken } from 'livekit-server-sdk'
import { createClient } from '@/lib/supabase/server'
import { err } from '@/types/api'

const MAX_PARTICIPANTS = 5

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(err('ログインが必要です'), { status: 401 })
  }

  const { gameId } = await request.json() as { gameId: string }
  if (!gameId) {
    return NextResponse.json(err('gameIdが必要です'), { status: 400 })
  }

  const roomName = `game-${gameId}`

  // 現在の参加人数を確認（LiveKit REST API）
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

  if (res.ok) {
    const data = await res.json() as { participants?: unknown[] }
    const count = data.participants?.length ?? 0
    if (count >= MAX_PARTICIPANTS) {
      return NextResponse.json(err('通話が満員です（最大5人）'), { status: 403 })
    }
  }

  const participantName = user.email?.split('@')[0] ?? user.id.slice(0, 8)
  const token = new AccessToken(apiKey, apiSecret, {
    identity: user.id,
    name: participantName,
    ttl: 3600,
  })
  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
  })

  return NextResponse.json({ token: await token.toJwt(), roomName })
}
