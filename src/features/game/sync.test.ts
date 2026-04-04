import { describe, it, expect } from 'vitest'
import { parseScheduledAt } from './sync'

describe('parseScheduledAt', () => {
  it('ISO UTC文字列をそのまま返す', () => {
    expect(parseScheduledAt('2026-04-04', '2026-04-04T19:00:00Z')).toBe('2026-04-04T19:00:00Z')
    expect(parseScheduledAt('2026-04-05', '2026-04-05T19:30:00Z')).toBe('2026-04-05T19:30:00Z')
    expect(parseScheduledAt('2026-04-04', '2026-04-04T23:00:00Z')).toBe('2026-04-04T23:00:00Z')
  })

  it('Final → 日付の00:00 UTC にフォールバック', () => {
    expect(parseScheduledAt('2026-04-04', 'Final')).toBe('2026-04-04T00:00:00.000Z')
  })

  it('試合中ステータス → フォールバック', () => {
    expect(parseScheduledAt('2026-04-04', 'Qtr 3 5:23')).toBe('2026-04-04T00:00:00.000Z')
  })
})
