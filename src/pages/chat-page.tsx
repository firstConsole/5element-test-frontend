import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/auth-context'
import { ChatSidebar } from '@/components/chat/chat-sidebar'
import { ChatWindow } from '@/components/chat/chat-window'
import { RenameChatDialog } from '@/components/chat/rename-chat-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Button } from '@/components/ui/button'
import {
  createChat,
  deleteChat,
  listChats,
  renameChat,
} from '@/lib/chats-api'
import type { Chat } from '@/lib/types'

export function ChatPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<Chat | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Chat | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    listChats()
      .then(setChats)
      .catch((error) =>
        toast.error(
          error instanceof Error ? error.message : 'Не удалось загрузить чаты',
        ),
      )
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      const chat = await createChat()
      setChats((prev) => [chat, ...prev])
      setSelectedId(chat.id)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось создать чат',
      )
    } finally {
      setCreating(false)
    }
  }

  async function handleRenameSubmit(title: string) {
    if (!renameTarget) return
    setRenaming(true)
    try {
      const updated = await renameChat(renameTarget.id, title)
      setChats((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)),
      )
      setRenameTarget(null)
      toast.success('Чат переименован')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось переименовать чат',
      )
    } finally {
      setRenaming(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteChat(deleteTarget.id)
      setChats((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      if (selectedId === deleteTarget.id) setSelectedId(null)
      setDeleteTarget(null)
      toast.success('Чат удалён')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Не удалось удалить чат',
      )
    } finally {
      setDeleting(false)
    }
  }

  function handleLogoutConfirm() {
    logout()
    navigate('/login', { replace: true })
  }

  function handleChatActivity(chatId: number) {
    setChats((prev) => {
      const index = prev.findIndex((c) => c.id === chatId)
      if (index <= 0) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      return [moved, ...next]
    })
  }

  const selectedChat = chats.find((c) => c.id === selectedId) ?? null

  return (
    <div className="flex h-svh">
      <ChatSidebar
        chats={chats}
        loading={loading}
        selectedId={selectedId}
        creating={creating}
        onSelect={setSelectedId}
        onCreate={handleCreate}
        onRename={setRenameTarget}
        onDelete={setDeleteTarget}
      />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-4 py-3">
          <span className="truncate font-semibold">
            {selectedChat ? selectedChat.title : '5 Element — Чат'}
          </span>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer"
              onClick={() => setLogoutOpen(true)}
            >
              <LogOut className="size-4" />
              Выйти
            </Button>
          </div>
        </header>

        {selectedChat ? (
          <ChatWindow
            key={selectedChat.id}
            chatId={selectedChat.id}
            onActivity={handleChatActivity}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-4">
            <p className="text-muted-foreground">
              Выберите чат или создайте новый
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Выйти из системы?"
        description="Текущая сессия будет завершена."
        confirmLabel="Выйти"
        onConfirm={handleLogoutConfirm}
      />

      <RenameChatDialog
        open={renameTarget !== null}
        onOpenChange={(open) => !open && setRenameTarget(null)}
        currentTitle={renameTarget?.title ?? ''}
        loading={renaming}
        onSubmit={handleRenameSubmit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Удалить чат?"
        description={
          deleteTarget
            ? `Чат «${deleteTarget.title}» и все его сообщения будут удалены безвозвратно.`
            : undefined
        }
        confirmLabel="Удалить"
        destructive
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
