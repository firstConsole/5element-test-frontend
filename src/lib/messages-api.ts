import { apiFetch } from './api'
import type { Message } from './types'

export function listMessages(chatId: number): Promise<Message[]> {
  return apiFetch<Message[]>(`/chats/${chatId}/messages`)
}

export function sendMessage(
  chatId: number,
  content: string,
  model?: string,
): Promise<Message> {
  return apiFetch<Message>(`/chats/${chatId}/messages`, {
    method: 'POST',
    body: model ? { content, model } : { content },
  })
}
