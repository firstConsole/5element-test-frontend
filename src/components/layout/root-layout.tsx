import { Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'

export function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-center" />
    </>
  )
}
