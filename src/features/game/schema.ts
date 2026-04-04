import { z } from 'zod'

export const GameStatusSchema = z.enum(['scheduled', 'live', 'final'])

export const GameSchema = z.object({
  id: z.string().uuid(),
  externalId: z.string(),
  homeTeam: z.string(),
  awayTeam: z.string(),
  homeScore: z.number().int().nullable(),
  awayScore: z.number().int().nullable(),
  status: GameStatusSchema,
  period: z.number().int().default(0),
  gameTime: z.string().default(''),
  scheduledAt: z.string(),
  startedAt: z.string().nullable(),
  endedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Game = z.infer<typeof GameSchema>
export type GameStatus = z.infer<typeof GameStatusSchema>
