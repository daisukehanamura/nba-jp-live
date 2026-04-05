'use client'

import { useState } from 'react'
import type { PredictedWinner, PredictionSummary } from '../schema'
import { calcOdds } from '../schema'
import type { GameStatus } from '@/features/game/schema'

interface PredictionPanelProps {
  gameId: string
  homeTeam: string
  awayTeam: string
  gameStatus: GameStatus
  period: number
  initialSummary: PredictionSummary
  isLoggedIn: boolean
}

export function PredictionPanel({
  gameId,
  homeTeam,
  awayTeam,
  gameStatus,
  period,
  initialSummary,
  isLoggedIn,
}: PredictionPanelProps) {
  const [summary, setSummary] = useState(initialSummary)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = summary.homeCount + summary.awayCount
  const homePercent = total === 0 ? 50 : Math.round((summary.homeCount / total) * 100)
  const awayPercent = total === 0 ? 50 : 100 - homePercent

  const hasVoted = summary.userPrediction !== null
  const isFinal = gameStatus === 'final'
  // Q3以降（ハーフタイム後）は予測締め切り
  const isClosed = gameStatus === 'live' && period >= 3
  const showResults = hasVoted || isFinal || isClosed

  async function handleVote(predictedWinner: PredictedWinner) {
    if (!isLoggedIn || hasVoted || loading) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/predictions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, predictedWinner }),
    })

    if (res.ok) {
      const data = await res.json()
      const earnedOdds: number = data?.data?.odds ?? 1.0
      const newHomeCount = predictedWinner === 'home' ? summary.homeCount + 1 : summary.homeCount
      const newAwayCount = predictedWinner === 'away' ? summary.awayCount + 1 : summary.awayCount
      const newTotal = newHomeCount + newAwayCount
      setSummary({
        homeCount: newHomeCount,
        awayCount: newAwayCount,
        homeOdds: calcOdds(newTotal + 1, newHomeCount + 1),
        awayOdds: calcOdds(newTotal + 1, newAwayCount + 1),
        userPrediction: predictedWinner,
        userOdds: earnedOdds,
        userPointsEarned: null,
      })
    } else {
      const data = await res.json().catch(() => null)
      setError(data?.error ?? '予測に失敗しました')
    }

    setLoading(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
        勝利予測
      </h2>

      {showResults ? (
        <ResultsView
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homePercent={homePercent}
          awayPercent={awayPercent}
          userPrediction={summary.userPrediction}
          userOdds={summary.userOdds}
          userPointsEarned={summary.userPointsEarned}
          total={total}
          isFinal={isFinal}
          isClosed={isClosed}
        />
      ) : (
        <VoteButtons
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeOdds={summary.homeOdds}
          awayOdds={summary.awayOdds}
          isLoggedIn={isLoggedIn}
          loading={loading}
          onVote={handleVote}
        />
      )}

      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
    </div>
  )
}

function VoteButtons({
  homeTeam,
  awayTeam,
  homeOdds,
  awayOdds,
  isLoggedIn,
  loading,
  onVote,
}: {
  homeTeam: string
  awayTeam: string
  homeOdds: number
  awayOdds: number
  isLoggedIn: boolean
  loading: boolean
  onVote: (w: PredictedWinner) => void
}) {
  if (!isLoggedIn) {
    return (
      <p className="text-center text-sm text-gray-600 py-2">
        予測するには{' '}
        <a href="/auth/login" className="text-blue-500 hover:underline font-medium">
          ログイン
        </a>
        {' '}が必要です
      </p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onVote('away')}
        disabled={loading}
        className="flex flex-col items-center gap-1 border-2 border-gray-200 rounded-xl px-4 py-4 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 active:scale-[0.98]"
      >
        <span className="text-xs text-gray-600 font-medium">AWAY</span>
        <span className="font-bold text-gray-900 text-sm text-center leading-tight">{awayTeam}</span>
        <span className="text-blue-600 font-bold text-lg">{awayOdds.toFixed(1)}倍</span>
      </button>
      <button
        onClick={() => onVote('home')}
        disabled={loading}
        className="flex flex-col items-center gap-1 border-2 border-gray-200 rounded-xl px-4 py-4 hover:border-orange-400 hover:bg-orange-50 transition-all disabled:opacity-50 active:scale-[0.98]"
      >
        <span className="text-xs text-gray-600 font-medium">HOME</span>
        <span className="font-bold text-gray-900 text-sm text-center leading-tight">{homeTeam}</span>
        <span className="text-orange-500 font-bold text-lg">{homeOdds.toFixed(1)}倍</span>
      </button>
    </div>
  )
}

function ResultsView({
  homeTeam,
  awayTeam,
  homePercent,
  awayPercent,
  userPrediction,
  userOdds,
  userPointsEarned,
  total,
  isFinal,
  isClosed,
}: {
  homeTeam: string
  awayTeam: string
  homePercent: number
  awayPercent: number
  userPrediction: PredictedWinner | null
  userOdds: number | null
  userPointsEarned: number | null
  total: number
  isFinal: boolean
  isClosed: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      {isClosed && !userPrediction && (
        <p className="text-xs text-center text-gray-500 bg-gray-50 rounded-lg py-2">
          🔒 ハーフタイムを過ぎたため締め切りました
        </p>
      )}

      <div className="flex rounded-full overflow-hidden h-3">
        <div className="bg-blue-500 transition-all duration-500" style={{ width: `${awayPercent}%` }} />
        <div className="bg-orange-400 transition-all duration-500" style={{ width: `${homePercent}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className={`flex flex-col gap-0.5 p-3 rounded-xl border-2 transition-colors ${
          userPrediction === 'away' ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50'
        }`}>
          <span className="text-xs text-gray-600">AWAY</span>
          <span className="font-bold text-gray-900 text-sm leading-tight">{awayTeam}</span>
          <span className="text-xl font-bold text-blue-500">{awayPercent}%</span>
        </div>
        <div className={`flex flex-col gap-0.5 p-3 rounded-xl border-2 transition-colors ${
          userPrediction === 'home' ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-gray-50'
        }`}>
          <span className="text-xs text-gray-600">HOME</span>
          <span className="font-bold text-gray-900 text-sm leading-tight">{homeTeam}</span>
          <span className="text-xl font-bold text-orange-400">{homePercent}%</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{total}人が予測</span>
        {userPrediction && userOdds && (
          <span className="font-medium">
            あなた: {userPrediction === 'away' ? awayTeam : homeTeam} × {userOdds.toFixed(1)}倍
            {userPointsEarned !== null && userPointsEarned > 0 && (
              <span className="text-green-600 font-bold ml-1">+{userPointsEarned}pt 獲得!</span>
            )}
            {userPointsEarned === 0 && isFinal && (
              <span className="text-gray-500 ml-1">（はずれ）</span>
            )}
            {userPointsEarned === null && !isFinal && (
              <span className="text-gray-500 ml-1">（結果待ち）</span>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
