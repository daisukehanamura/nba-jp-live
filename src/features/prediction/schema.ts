import { z } from 'zod'

export const PredictedWinnerSchema = z.enum(['home', 'away'])

export const PostPredictionSchema = z.object({
  gameId: z.string().uuid(),
  predictedWinner: PredictedWinnerSchema,
})

export const PredictionSummarySchema = z.object({
  homeCount: z.number().int(),
  awayCount: z.number().int(),
  userPrediction: PredictedWinnerSchema.nullable(),
})

export type PredictedWinner = z.infer<typeof PredictedWinnerSchema>
export type PredictionSummary = z.infer<typeof PredictionSummarySchema>
