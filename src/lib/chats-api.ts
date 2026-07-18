import { apiFetch } from './api'
import type { Chat } from './types'

export function listChats(): Promise<Chat[]> {
  return apiFetch<Chat[]>('/chats')
}

export function createChat(title?: string): Promise<Chat> {
  return apiFetch<Chat>('/chats', {
    method: 'POST',
    body: title ? { title } : {},
  })
}

export function renameChat(id: number, title: string): Promise<Chat> {
  return apiFetch<Chat>(`/chats/${id}`, {
    method: 'PATCH',
    body: { title },
  })
}

export function deleteChat(id: number): Promise<void> {
  return apiFetch<void>(`/chats/${id}`, { method: 'DELETE' })
}
