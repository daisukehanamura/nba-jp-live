'use client'

import { useState } from 'react'
import type { PredictedWinner, PredictionSummary } from '../schema'
import type { GameStatus } from '@/features/game/schema'

interface PredictionPanelProps {
  gameId: string
  homeTeam: string
  awayTeam: string
  gameStatus: GameStatus
  initialSummary: PredictionSummary
  isLoggedIn: boolean
}

export function PredictionPanel({
  gameId,
  homeTeam,
  awayTeam,
  gameStatus,
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
  const showResults = hasVoted || isFinal

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
      setSummary((prev) => ({
        ...prev,
        homeCount: predictedWinner === 'home' ? prev.homeCount + 1 : prev.homeCount,
        awayCount: predictedWinner === 'away' ? prev.awayCount + 1 : prev.awayCount,
        userPrediction: predictedWinner,
      }))
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
          total={total}
        />
      ) : (
        <VoteButtons
          homeTeam={homeTeam}
          awayTeam={awayTeam}
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
  isLoggedIn,
  loading,
  onVote,
}: {
  homeTeam: string
  awayTeam: string
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
      </button>
      <button
        onClick={() => onVote('home')}
        disabled={loading}
        className="flex flex-col items-center gap-1 border-2 border-gray-200 rounded-xl px-4 py-4 hover:border-blue-400 hover:bg-blue-50 transition-all disabled:opacity-50 active:scale-[0.98]"
      >
        <span className="text-xs text-gray-600 font-medium">HOME</span>
        <span className="font-bold text-gray-900 text-sm text-center leading-tight">{homeTeam}</span>
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
  total,
}: {
  homeTeam: string
  awayTeam: string
  homePercent: number
  awayPercent: number
  userPrediction: PredictedWinner | null
  total: number
}) {
  return (
    <div className="flex flex-col gap-3">
      {/* Percentage bar */}
      <div className="flex rounded-full overflow-hidden h-3">
        <div
          className="bg-blue-500 transition-all duration-500"
          style={{ width: `${awayPercent}%` }}
        />
        <div
          className="bg-orange-400 transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
      </div>

      {/* Labels */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`flex flex-col gap-0.5 p-3 rounded-xl border-2 transition-colors ${
          userPrediction === 'away' ? 'border-blue-400 bg-blue-50' : 'border-gray-100 bg-gray-50'
        }`}>
          <span className="text-xs text-gray-600">AWAY {userPrediction === 'away' && '✓ あなたの予測'}</span>
          <span className="font-bold text-gray-900 text-sm leading-tight">{awayTeam}</span>
          <span className="text-xl font-bold text-blue-500">{awayPercent}%</span>
        </div>
        <div className={`flex flex-col gap-0.5 p-3 rounded-xl border-2 transition-colors ${
          userPrediction === 'home' ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-gray-50'
        }`}>
          <span className="text-xs text-gray-600">HOME {userPrediction === 'home' && '✓ あなたの予測'}</span>
          <span className="font-bold text-gray-900 text-sm leading-tight">{homeTeam}</span>
          <span className="text-xl font-bold text-orange-400">{homePercent}%</span>
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">{total}人が予測</p>
    </div>
  )
}
