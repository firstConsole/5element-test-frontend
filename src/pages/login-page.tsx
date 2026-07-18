import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Вход</CardTitle>
          <CardDescription>Форма появится на следующем этапе</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full cursor-pointer">Войти</Button>
        </CardContent>
      </Card>
    </div>
  )
}
