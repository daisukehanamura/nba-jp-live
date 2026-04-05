'use client'

import Link from 'next/link'

interface DateNavProps {
  currentDate: string // YYYY-MM-DD
}

function getJstBasedToday(): string {
  const jstToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date())
  const d = new Date(`${jstToday}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().split('T')[0]!
}

function formatDisplay(dateStr: string): string {
  const todayStr = getJstBasedToday()
  const yesterdayStr = shiftDate(todayStr, -1)
  const tomorrowStr = shiftDate(todayStr, 1)

  if (dateStr === todayStr) return '今日'
  if (dateStr === yesterdayStr) return '昨日'
  if (dateStr === tomorrowStr) return '明日'

  // 表示はJST日付（ET+1日）
  const jstDate = new Date(`${shiftDate(dateStr, 1)}T12:00:00Z`)
  return jstDate.toLocaleDateString('ja-JP', {
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
  const todayStr = getJstBasedToday()

  return (
    <div className="flex items-center justify-between gap-2">
      <Link
        href={`/games?date=${prevDate}`}
        prefetch={true}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
      >
        ← {formatDisplay(prevDate)}
      </Link>

      <div className="flex flex-col items-center">
        <span className="font-bold text-lg">{formatDisplay(currentDate)}</span>
        <span className="text-xs text-gray-600">{shiftDate(currentDate, 1)}</span>
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
          prefetch={true}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {formatDisplay(nextDate)} →
        </Link>
      </div>
    </div>
  )
}
