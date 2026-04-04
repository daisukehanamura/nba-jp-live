'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5分

interface LiveRefreshProps {
  hasLiveGames: boolean
}

// ライブ試合がある場合のみ5分ごとにページデータを再取得する
export function LiveRefresh({ hasLiveGames }: LiveRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    if (!hasLiveGames) return

    const id = setInterval(() => {
      router.refresh()
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(id)
  }, [hasLiveGames, router])

  return null
}
