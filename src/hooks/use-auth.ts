'use client'

import { useSession } from 'next-auth/react'
import type { UserRole } from '@/lib/auth'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  closerId: string | null
}

export function useAuth() {
  const { data: session, status } = useSession()

  const user: AuthUser | null = session?.user
    ? {
        id: (session.user as AuthUser).id,
        email: session.user.email || '',
        name: session.user.name || '',
        role: (session.user as AuthUser).role,
        closerId: (session.user as AuthUser).closerId,
      }
    : null

  return {
    user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    isManager: user?.role === 'manager',
    isRep: user?.role === 'rep',
  }
}
