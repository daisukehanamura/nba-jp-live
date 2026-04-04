import { describe, it, expect } from 'vitest'
import { parseScheduledAt } from './sync'

describe('parseScheduledAt', () => {
  // EDT期間 (4月 = UTC-4)
  it('7:30 pm ET (EDT) → JST翌日8:30', () => {
    const result = parseScheduledAt('2026-04-04', '7:30 pm ET')
    // 19:30 ET (EDT=UTC-4) → 23:30 UTC → JST 08:30翌日
    expect(result).toBe('2026-04-04T23:30:00.000Z')
  })

  it('12:00 pm ET (EDT) → 16:00 UTC', () => {
    const result = parseScheduledAt('2026-04-04', '12:00 pm ET')
    expect(result).toBe('2026-04-04T16:00:00.000Z')
  })

  it('12:00 am ET → 04:00 UTC (EDT)', () => {
    const result = parseScheduledAt('2026-04-04', '12:00 am ET')
    expect(result).toBe('2026-04-04T04:00:00.000Z')
  })

  // EST期間 (1月 = UTC-5)
  it('7:30 pm ET (EST) → 00:30 UTC翌日', () => {
    const result = parseScheduledAt('2026-01-15', '7:30 pm ET')
    // 19:30 ET (EST=UTC-5) → 00:30 UTC翌日
    expect(result).toBe('2026-01-16T00:30:00.000Z')
  })

  // 試合中・終了の場合はフォールバック
  it('Final → 日付の00:00 UTC', () => {
    const result = parseScheduledAt('2026-04-04', 'Final')
    expect(result).toBe('2026-04-04T00:00:00.000Z')
  })

  it('Qtr 3 5:23 → 日付の00:00 UTC', () => {
    const result = parseScheduledAt('2026-04-04', 'Qtr 3 5:23')
    expect(result).toBe('2026-04-04T00:00:00.000Z')
  })
})
