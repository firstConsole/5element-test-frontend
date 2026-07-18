import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Info, Loader2, SendHorizonal } from 'lucide-react'
import { toast } from 'sonner'
import { MessageBubble } from '@/components/chat/message-bubble'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  listMessages,
  sendMessageWithTools,
  streamMessage,
} from '@/lib/messages-api'
import type { Message, ToolSpec } from '@/lib/types'

interface ChatWindowProps {
  chatId: number
  models?: string[]
  defaultModel?: string
  tools?: ToolSpec[]
  onActivity?: (chatId: number) => void
}

export function ChatWindow({
  chatId,
  models = [],
  defaultModel,
  tools = [],
  onActivity,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [input, setInput] = useState('')
  const [model, setModel] = useState<string | undefined>(defaultModel)
  const [toolsEnabled, setToolsEnabled] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (models.length === 0) {
      if (defaultModel) setModel((current) => current ?? defaultModel)
      return
    }

    setModel((current) => {
      if (current && models.includes(current)) return current
      if (defaultModel && models.includes(defaultModel)) return defaultModel
      return models[0]
    })
  }, [models, defaultModel])

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

  async function runStreaming(content: string) {
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
      { model, signal: controller.signal },
    )
  }

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return

    const userMessage: Message = {
      id: -Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setSending(true)

    try {
      if (toolsEnabled) {
        const assistant = await sendMessageWithTools(chatId, content, model)
        setMessages((prev) => [...prev, assistant])
        onActivity?.(chatId)
      } else {
        await runStreaming(content)
      }
    } catch (error) {
      const aborted = error instanceof DOMException && error.name === 'AbortError'
      if (!aborted) {
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
        <div className="mx-auto max-w-3xl space-y-2">
          <div className="flex items-center justify-between gap-2">
            {models.length > 0 ? (
              <Select
                value={model}
                onValueChange={setModel}
                disabled={sending}
              >
                <SelectTrigger className="h-8 w-[220px] cursor-pointer">
                  <SelectValue placeholder="Модель" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m} value={m} className="cursor-pointer">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="tools"
                checked={toolsEnabled}
                onCheckedChange={setToolsEnabled}
                disabled={sending}
                className="cursor-pointer"
              />
              <Label
                htmlFor="tools"
                className="cursor-pointer text-xs text-muted-foreground"
              >
                Инструменты
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Про инструменты"
                    className="cursor-help text-muted-foreground hover:text-foreground"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1.5">
                    <p>
                      Модель может вызывать серверные функции (tool calling).
                      Нужна модель с поддержкой tools (llama3 — без поддержки,
                      попробуйте qwen2.5).
                    </p>
                    {tools.length > 0 ? (
                      <div>
                        <p className="font-medium">Доступные инструменты:</p>
                        <ul className="mt-0.5 space-y-0.5">
                          {tools.map((tool) => (
                            <li key={tool.name}>
                              <code>{tool.name}</code> — {tool.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p>Список инструментов недоступен.</p>
                    )}
                    <p className="text-background/70">
                      Если инструмент был вызван — под ответом появится отметка.
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div className="flex items-end gap-2">
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
