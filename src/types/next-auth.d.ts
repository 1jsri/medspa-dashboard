import type { UserRole } from '@/lib/auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      closerId: string | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    closerId: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    closerId: string | null
  }
}
