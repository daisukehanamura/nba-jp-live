'use client'

import Link from 'next/link'

interface DateNavProps {
  currentDate: string // YYYY-MM-DD
}

function formatDisplay(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00Z`)
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const tomorrowDate = new Date(today)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)

  if (dateStr === todayStr) return '今日'
  if (dateStr === yesterday.toISOString().split('T')[0]) return '昨日'
  if (dateStr === tomorrowDate.toISOString().split('T')[0]) return '明日'

  return date.toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'UTC',
  })
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]!
}

export function DateNav({ currentDate }: DateNavProps) {
  const prevDate = shiftDate(currentDate, -1)
  const nextDate = shiftDate(currentDate, 1)
  const todayStr = new Date().toISOString().split('T')[0]!

  return (
    <div className="flex items-center justify-between gap-2">
      <Link
        href={`/games?date=${prevDate}`}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
      >
        ← {formatDisplay(prevDate)}
      </Link>

      <div className="flex flex-col items-center">
        <span className="font-bold text-lg">{formatDisplay(currentDate)}</span>
        <span className="text-xs text-gray-400">{currentDate}</span>
      </div>

      <div className="flex items-center gap-2">
        {currentDate !== todayStr && (
          <Link
            href="/games"
            className="text-xs text-blue-500 hover:underline"
          >
            今日
          </Link>
        )}
        <Link
          href={`/games?date=${nextDate}`}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {formatDisplay(nextDate)} →
        </Link>
      </div>
    </div>
  )
}
