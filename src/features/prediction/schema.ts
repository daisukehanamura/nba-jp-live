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
// rankFactor : 対戦チームの勝率比（弱チーム選択→高オッズ、強チーム選択→低オッズ）
// scoreFactor: 試合中の点差補正（負けているチーム→高オッズ、リード中→低オッズ）
// min 1.1 / max 10.0
export function calcOdds(
  totalAfter: number,
  chosenAfter: number,
  rankFactor = 1.0,
  scoreFactor = 1.0,
): number {
  const base = totalAfter / chosenAfter
  const adjusted = base * rankFactor * scoreFactor
  return Math.min(10.0, Math.max(1.1, Math.round(adjusted * 10) / 10))
}
