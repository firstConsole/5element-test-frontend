import { apiFetch } from './api'
import type { ModelsResponse } from './types'

export function fetchModels(): Promise<ModelsResponse> {
  return apiFetch<ModelsResponse>('/models')
}
