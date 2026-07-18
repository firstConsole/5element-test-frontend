export type MessageRole = 'user' | 'assistant' | 'system'

export interface User {
  id: number
  email: string
  created_at: string
}

export interface Token {
  access_token: string
  token_type: string
}

export interface Chat {
  id: number
  title: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  role: MessageRole
  content: string
  created_at: string
  /** Инструменты, вызванные при генерации (только для ответа /messages/tools). */
  tools_used?: string[]
}

export interface ModelsResponse {
  provider: string
  default: string
  models: string[]
}

export interface ToolSpec {
  name: string
  description: string
  parameters: Record<string, unknown>
}
