import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Chat } from '@/lib/types'

interface ChatSidebarProps {
  chats: Chat[]
  loading: boolean
  selectedId: number | null
  creating?: boolean
  onSelect: (id: number) => void
  onCreate: () => void
  onRename: (chat: Chat) => void
  onDelete: (chat: Chat) => void
}

export function ChatSidebar({
  chats,
  loading,
  selectedId,
  creating = false,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: ChatSidebarProps) {
  return (
    <aside className="flex w-72 flex-col border-r bg-sidebar">
      <div className="p-3">
        <Button
          className="w-full cursor-pointer"
          onClick={onCreate}
          disabled={creating}
        >
          <Plus className="size-4" />
          Новый чат
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))
          ) : chats.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              Пока нет чатов. Создайте первый.
            </p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  'group flex items-center gap-1 rounded-md pr-1',
                  selectedId === chat.id
                    ? 'bg-accent'
                    : 'hover:bg-accent/50',
                )}
              >
                <button
                  type="button"
                  className="flex-1 cursor-pointer truncate px-3 py-2 text-left text-sm"
                  onClick={() => onSelect(chat.id)}
                  title={chat.title}
                >
                  {chat.title}
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
                    >
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Действия с чатом</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => onRename(chat)}
                    >
                      <Pencil className="size-4" />
                      Переименовать
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      className="cursor-pointer"
                      onClick={() => onDelete(chat)}
                    >
                      <Trash2 className="size-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
