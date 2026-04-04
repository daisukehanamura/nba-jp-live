export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  meta?: {
    total: number
    limit: number
    offset: number
  }
}

export function ok<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return { success: true, data, meta }
}

export function err(message: string): ApiResponse<never> {
  return { success: false, error: message }
}
