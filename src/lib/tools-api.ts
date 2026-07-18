import { apiFetch } from './api'
import type { ToolSpec } from './types'

export function fetchTools(): Promise<ToolSpec[]> {
  return apiFetch<ToolSpec[]>('/tools')
}
