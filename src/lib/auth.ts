import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export type UserRole = 'manager' | 'rep'

export interface AppUser {
  id: string
  email: string
  name: string
  role: UserRole
  closerId: string | null
}

// Hardcoded users for MVP
// In production, this would come from a database
const users: AppUser[] = [
  {
    id: '1',
    email: 'admin@medspa.com',
    name: 'Admin User',
    role: 'manager',
    closerId: null,
  },
  {
    id: '2',
    email: 'hannah@medspa.com',
    name: 'Hannah Smith',
    role: 'rep',
    closerId: 'Hannah',
  },
  {
    id: '3',
    email: 'michael@medspa.com',
    name: 'Michael Johnson',
    role: 'rep',
    closerId: 'Michael',
  },
]

// Shared password for MVP (in production, use individual hashed passwords)
const SHARED_PASSWORD = process.env.AUTH_PASSWORD || 'medspa2024'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user by email
        const user = users.find(
          (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
        )

        if (!user) {
          return null
        }

        // Check password
        if (credentials.password !== SHARED_PASSWORD) {
          return null
        }

        // Return user object for session
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          closerId: user.closerId,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add custom fields to token on initial sign in
      if (user) {
        token.role = (user as AppUser).role
        token.closerId = (user as AppUser).closerId
      }
      return token
    },
    async session({ session, token }) {
      // Add custom fields to session
      if (session.user) {
        (session.user as AppUser).role = token.role as UserRole
        (session.user as AppUser).closerId = token.closerId as string | null
        (session.user as AppUser).id = token.sub as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-development-secret-key-change-in-production',
}

// Helper to check if user is a manager
export function isManager(role: UserRole | undefined): boolean {
  return role === 'manager'
}

// Helper to check if user is a rep
export function isRep(role: UserRole | undefined): boolean {
  return role === 'rep'
}
