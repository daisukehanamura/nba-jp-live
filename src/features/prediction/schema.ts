import { z } from 'zod'

export const PredictedWinnerSchema = z.enum(['home', 'away'])

export const PostPredictionSchema = z.object({
  gameId: z.string().uuid(),
  predictedWinner: PredictedWinnerSchema,
})

export const PredictionSummarySchema = z.object({
  homeCount: z.number().int(),
  awayCount: z.number().int(),
  homeOdds: z.number(),
  awayOdds: z.number(),
  userPrediction: PredictedWinnerSchema.nullable(),
  userOdds: z.number().nullable(),
  userPointsEarned: z.number().int().nullable(),
})

export type PredictedWinner = z.infer<typeof PredictedWinnerSchema>
export type PredictionSummary = z.infer<typeof PredictionSummarySchema>

// オッズ計算: 投票後の状態を想定して算出
// min 1.1 / max 10.0
export function calcOdds(totalAfter: number, chosenAfter: number): number {
  const raw = totalAfter / chosenAfter
  return Math.min(10.0, Math.max(1.1, Math.round(raw * 10) / 10))
}
