import { Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/types'

/** Пузырь одного сообщения: справа — пользователь, слева — ассистент. */
export function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  const toolsUsed = message.tools_used ?? []

  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap break-words',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground',
        )}
      >
        {message.content}
      </div>

      {toolsUsed.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
          <Wrench className="size-3" />
          <span>Использованы инструменты:</span>
          {toolsUsed.map((tool) => (
            <code
              key={tool}
              className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground"
            >
              {tool}
            </code>
          ))}
        </div>
      )}
    </div>
  )
}
