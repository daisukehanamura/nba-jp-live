import { describe, it, expect } from 'vitest'
import { PostCommentSchema } from './schema'

const validGameId = '550e8400-e29b-41d4-a716-446655440000'

describe('PostCommentSchema', () => {
  it('有効なコメントを受け付ける', () => {
    const result = PostCommentSchema.safeParse({
      gameId: validGameId,
      content: 'やばい！',
    })
    expect(result.success).toBe(true)
  })

  it('空のコメントを拒否する', () => {
    const result = PostCommentSchema.safeParse({
      gameId: validGameId,
      content: '',
    })
    expect(result.success).toBe(false)
  })

  it('201文字以上のコメントを拒否する', () => {
    const result = PostCommentSchema.safeParse({
      gameId: validGameId,
      content: 'あ'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('200文字ちょうどは受け付ける', () => {
    const result = PostCommentSchema.safeParse({
      gameId: validGameId,
      content: 'あ'.repeat(200),
    })
    expect(result.success).toBe(true)
  })

  it('無効なgameIdを拒否する', () => {
    const result = PostCommentSchema.safeParse({
      gameId: 'not-a-uuid',
      content: 'やばい！',
    })
    expect(result.success).toBe(false)
  })
})
