import { z } from 'zod'

export const CommentSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().min(1).max(200),
  createdAt: z.string(),
  profile: z.object({
    username: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().nullable(),
  }).optional(),
})

export const PostCommentSchema = z.object({
  gameId: z.string().uuid(),
  content: z.string()
    .min(1, 'コメントを入力してください')
    .max(200, '200文字以内で入力してください'),
})

export type Comment = z.infer<typeof CommentSchema>
export type PostCommentInput = z.infer<typeof PostCommentSchema>
