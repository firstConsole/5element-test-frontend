import { createBrowserRouter } from 'react-router-dom'
import { RootLayout } from '@/components/layout/root-layout'
import { RequireAuth } from '@/components/require-auth'
import { ChatPage } from '@/pages/chat-page'
import { LoginPage } from '@/pages/login-page'
import { NotFoundPage } from '@/pages/not-found-page'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <RequireAuth />,
        children: [{ path: '/', element: <ChatPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
