import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Loader2, SendHorizonal } from 'lucide-react'
import { toast } from 'sonner'
import { MessageBubble } from '@/components/chat/message-bubble'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { listMessages, streamMessage } from '@/lib/messages-api'
import type { Message } from '@/lib/types'

interface ChatWindowProps {
  chatId: number
  onActivity?: (chatId: number) => void
}

export function ChatWindow({ chatId, onActivity }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    listMessages(chatId)
      .then(setMessages)
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : 'Не удалось загрузить историю',
        ),
      )
      .finally(() => setLoading(false))
  }, [chatId])

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return

    const now = new Date().toISOString()
    const userMessage: Message = {
      id: -Date.now(),
      role: 'user',
      content,
      created_at: now,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    const controller = new AbortController()
    abortRef.current = controller

    let assistantId: number | null = null
    let accumulated = ''

    const upsertAssistant = (text: string) => {
      accumulated += text

      if (assistantId === null) {
        const id = -Date.now() - 1
        assistantId = id
        const created_at = new Date().toISOString()
        
        setMessages((prev) => [
          ...prev,
          { id, role: 'assistant', content: accumulated, created_at },
        ])
      } else {
        const id = assistantId
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, content: accumulated } : m)),
        )
      }
    }

    try {
      await streamMessage(
        chatId,
        content,
        {
          onDelta: upsertAssistant,
          onError: (message) => toast.error(message),
          onDone: (messageId) => {
            if (assistantId !== null && messageId) {
              const tempId = assistantId
              setMessages((prev) =>
                prev.map((m) => (m.id === tempId ? { ...m, id: messageId } : m)),
              )
            }
            onActivity?.(chatId)
          },
        },
        { signal: controller.signal },
      )
    } catch (error) {
      if (!controller.signal.aborted) {
        toast.error(
          error instanceof Error ? error.message : 'Не удалось получить ответ',
        )
      }
    } finally {
      setSending(false)
      abortRef.current = null
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void handleSend()
    }
  }

  const showTyping =
    sending &&
    (messages.length === 0 ||
      messages[messages.length - 1].role === 'user')

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 p-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Начните диалог — отправьте первое сообщение.
            </p>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}

          {showTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение… (Enter — отправить, Shift+Enter — перенос)"
            rows={1}
            className="max-h-40 min-h-10 flex-1 resize-none"
            disabled={sending}
          />
          <Button
            className="cursor-pointer"
            onClick={() => void handleSend()}
            disabled={sending || !input.trim()}
          >
            {sending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SendHorizonal className="size-4" />
            )}
            <span className="sr-only">Отправить</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex gap-1 rounded-lg bg-muted px-4 py-3">
        <span className="size-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-foreground/40 [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-foreground/40" />
      </div>
    </div>
  )
}
