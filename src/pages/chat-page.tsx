import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'

export function ChatPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function onLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <span className="font-semibold">5 Element — Чат</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            onClick={onLogout}
          >
            <LogOut className="size-4" />
            Выйти
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Чаты</h1>
          <p className="text-muted-foreground">
            Интерфейс чата — следующие этапы
          </p>
        </div>
      </div>
    </div>
  )
}
