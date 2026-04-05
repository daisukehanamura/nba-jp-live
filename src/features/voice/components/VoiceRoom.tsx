'use client'

import { useState, useCallback } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useParticipants,
  useLocalParticipant,
} from '@livekit/components-react'
import '@livekit/components-styles'

interface VoiceRoomProps {
  gameId: string
  isLoggedIn: boolean
}

function ParticipantList() {
  const participants = useParticipants()
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()

  return (
    <div className="flex flex-col gap-3">
      {/* リモート音声再生 */}
      <RoomAudioRenderer />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {participants.map((p) => {
            const isLocal = p.identity === localParticipant.identity
            const muted = isLocal ? !isMicrophoneEnabled : p.isMicrophoneEnabled === false
            return (
              <div
                key={p.identity}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isLocal ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${muted ? 'bg-gray-400' : 'bg-green-500'}`} />
                {p.name ?? p.identity}
                {isLocal && ' (あなた)'}
              </div>
            )
          })}
        </div>
        <span className="text-xs text-gray-500">{participants.length}/5人</span>
      </div>

      <button
        onClick={() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
        className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${
          isMicrophoneEnabled
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-green-100 text-green-600 hover:bg-green-200'
        }`}
      >
        {isMicrophoneEnabled ? '🎙️ ミュート' : '🎙️ ミュート解除'}
      </button>
    </div>
  )
}

export function VoiceRoom({ gameId, isLoggedIn }: VoiceRoomProps) {
  const [token, setToken] = useState<string | null>(null)
  const [roomName, setRoomName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const join = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/voice/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId }),
    })
    const data = await res.json() as { token?: string; roomName?: string; error?: string }
    if (!res.ok || !data.token) {
      setError(data.error ?? '参加に失敗しました')
      setLoading(false)
      return
    }
    setToken(data.token)
    setRoomName(data.roomName ?? null)
    setLoading(false)
  }, [gameId])

  const leave = useCallback(() => {
    setToken(null)
    setRoomName(null)
  }, [])

  if (!isLoggedIn) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <p className="text-sm text-gray-600 text-center">
          🎙️ 音声通話に参加するには
          <a href="/auth/login" className="text-orange-500 font-medium ml-1">ログイン</a>
          が必要です
        </p>
      </div>
    )
  }

  if (token && roomName) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">🎙️ 音声通話中</h3>
          <button
            onClick={leave}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            退出
          </button>
        </div>
        <LiveKitRoom
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          audio={true}
          video={false}
          onDisconnected={leave}
        >
          <ParticipantList />
        </LiveKitRoom>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">🎙️ 音声通話</h3>
          <p className="text-xs text-gray-500 mt-0.5">最大5人で試合を語ろう</p>
        </div>
        <button
          onClick={join}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
        >
          {loading ? '接続中...' : '参加する'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  )
}
