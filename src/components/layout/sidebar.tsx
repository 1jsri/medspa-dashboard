'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  DollarSign,
  UserCircle,
  Sparkles,
  LogOut,
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, managerOnly: false },
  { name: 'Pipeline', href: '/dashboard/pipeline', icon: TrendingUp, managerOnly: false },
  { name: 'Closers', href: '/dashboard/closers', icon: Users, managerOnly: true },
  { name: 'Revenue', href: '/dashboard/revenue', icon: DollarSign, managerOnly: false },
  { name: 'Clients', href: '/dashboard/clients', icon: UserCircle, managerOnly: false },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, isManager } = useAuth()

  // Filter navigation based on role
  const visibleNavigation = navigation.filter(
    (item) => !item.managerOnly || isManager
  )

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900">
      <div className="flex h-16 items-center gap-2 px-6">
        <Sparkles className="h-8 w-8 text-rose-400" />
        <span className="text-xl font-bold text-white">MedSpa</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-slate-800 p-4">
        {user ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-slate-400">
                {isManager ? 'Manager' : 'Sales Rep'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Dashboard v1.0</p>
        )}
      </div>
    </div>
  )
}
