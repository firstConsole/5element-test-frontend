import { apiFetch } from './api'
import type { Token, User } from './types'

export function registerUser(email: string, password: string): Promise<User> {
  return apiFetch<User>('/auth/register', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}

export function loginRequest(email: string, password: string): Promise<Token> {
  return apiFetch<Token>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })
}

export function fetchCurrentUser(): Promise<User> {
  return apiFetch<User>('/auth/me')
}
