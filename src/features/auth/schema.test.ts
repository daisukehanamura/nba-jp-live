import { describe, it, expect } from 'vitest'
import { SignUpSchema, SignInSchema } from './schema'

describe('SignUpSchema', () => {
  it('有効な入力を受け付ける', () => {
    const result = SignUpSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      username: 'test_user',
      displayName: 'テストユーザー',
    })
    expect(result.success).toBe(true)
  })

  it('無効なメールアドレスを拒否する', () => {
    const result = SignUpSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
      username: 'test_user',
      displayName: 'テストユーザー',
    })
    expect(result.success).toBe(false)
  })

  it('8文字未満のパスワードを拒否する', () => {
    const result = SignUpSchema.safeParse({
      email: 'test@example.com',
      password: 'short',
      username: 'test_user',
      displayName: 'テストユーザー',
    })
    expect(result.success).toBe(false)
  })

  it('3文字未満のユーザー名を拒否する', () => {
    const result = SignUpSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      username: 'ab',
      displayName: 'テストユーザー',
    })
    expect(result.success).toBe(false)
  })

  it('記号を含むユーザー名を拒否する', () => {
    const result = SignUpSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      username: 'test-user!',
      displayName: 'テストユーザー',
    })
    expect(result.success).toBe(false)
  })
})

describe('SignInSchema', () => {
  it('有効な入力を受け付ける', () => {
    const result = SignInSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('空のパスワードを拒否する', () => {
    const result = SignInSchema.safeParse({
      email: 'test@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})
