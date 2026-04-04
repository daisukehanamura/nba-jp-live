import { describe, it, expect } from 'vitest'
import { GameSchema, GameStatusSchema } from './schema'

const validGame = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  externalId: 'nba-2026-001',
  homeTeam: 'Lakers',
  awayTeam: 'Celtics',
  homeScore: 110,
  awayScore: 105,
  status: 'final' as const,
  scheduledAt: '2026-04-04T00:00:00.000Z',
  startedAt: '2026-04-04T00:05:00.000Z',
  endedAt: '2026-04-04T02:30:00.000Z',
  createdAt: '2026-04-04T00:00:00.000Z',
  updatedAt: '2026-04-04T02:30:00.000Z',
}

describe('GameStatusSchema', () => {
  it('有効なステータスを受け付ける', () => {
    expect(GameStatusSchema.safeParse('scheduled').success).toBe(true)
    expect(GameStatusSchema.safeParse('live').success).toBe(true)
    expect(GameStatusSchema.safeParse('final').success).toBe(true)
  })

  it('無効なステータスを拒否する', () => {
    expect(GameStatusSchema.safeParse('unknown').success).toBe(false)
  })
})

describe('GameSchema', () => {
  it('有効な試合データを受け付ける', () => {
    expect(GameSchema.safeParse(validGame).success).toBe(true)
  })

  it('スコアがnullでも受け付ける（scheduledの試合）', () => {
    const result = GameSchema.safeParse({
      ...validGame,
      homeScore: null,
      awayScore: null,
      status: 'scheduled',
      startedAt: null,
      endedAt: null,
    })
    expect(result.success).toBe(true)
  })

  it('無効なUUIDを拒否する', () => {
    const result = GameSchema.safeParse({ ...validGame, id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})
