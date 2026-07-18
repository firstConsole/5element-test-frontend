import { ApiError, apiFetch } from './api'
import { clearToken, getToken } from './auth-storage'
import { API_URL } from './config'
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

export interface StreamHandlers {
  onDelta: (text: string) => void
  onDone: (messageId: number) => void
  onError: (message: string) => void
}

interface StreamOptions {
  model?: string
  signal?: AbortSignal
}

export async function streamMessage(
  chatId: number,
  content: string,
  handlers: StreamHandlers,
  options: StreamOptions = {},
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(
    `${API_URL}/chats/${chatId}/messages/stream`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(
        options.model ? { content, model: options.model } : { content },
      ),
      signal: options.signal,
    },
  )

  if (response.status === 401) clearToken()
  if (!response.ok || !response.body) {
    throw new ApiError(response.status, await extractError(response))
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const dispatch = (block: string) => {
    const line = block.split('\n').find((l) => l.startsWith('data:'))
    if (!line) return
    const payload = line.slice('data:'.length).trim()
    if (!payload) return

    let event: {
      delta?: string
      error?: string
      done?: boolean
      message_id?: number
    }
    try {
      event = JSON.parse(payload)
    } catch {
      return
    }

    if (event.error) handlers.onError(event.error)
    else if (event.delta) handlers.onDelta(event.delta)
    else if (event.done) handlers.onDone(event.message_id ?? 0)
  }

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    let boundary = buffer.indexOf('\n\n')
    while (boundary !== -1) {
      dispatch(buffer.slice(0, boundary))
      buffer = buffer.slice(boundary + 2)
      boundary = buffer.indexOf('\n\n')
    }
  }
  if (buffer.trim()) dispatch(buffer)
}

async function extractError(response: Response): Promise<string> {
  try {
    const data = await response.json()
    if (data && typeof data.detail === 'string') return data.detail
  } catch {
    /* ignore */
  }
  return response.statusText || 'Ошибка потока'
}
