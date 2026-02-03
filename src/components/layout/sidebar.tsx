'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useSidebar } from '@/contexts/sidebar-context'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  DollarSign,
  UserCircle,
  Sparkles,
  LogOut,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, managerOnly: false },
  { name: 'Marketing', href: '/dashboard/marketing', icon: Megaphone, managerOnly: false },
  { name: 'Scheduling', href: '/dashboard/scheduling', icon: Calendar, managerOnly: false },
  { name: 'Pipeline', href: '/dashboard/pipeline', icon: TrendingUp, managerOnly: false },
  { name: 'Closers', href: '/dashboard/closers', icon: Users, managerOnly: true },
  { name: 'Revenue', href: '/dashboard/revenue', icon: DollarSign, managerOnly: false },
  { name: 'Clients', href: '/dashboard/clients', icon: UserCircle, managerOnly: false },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, isManager } = useAuth()
  const { isOpen, isCollapsed, isMobile, setOpen, setCollapsed } = useSidebar()

  // Filter navigation based on role
  const visibleNavigation = navigation.filter(
    (item) => !item.managerOnly || isManager
  )

  const handleLogout = () => {
    signOut({ callbackUrl: '/login' })
  }

  const handleNavClick = () => {
    // Close mobile drawer on navigation
    if (isMobile) {
      setOpen(false)
    }
  }

  const sidebarContent = (
    <>
      {/* Header */}
      <div className={cn(
        'flex h-16 items-center gap-2 px-4 border-b border-slate-800',
        isCollapsed && !isMobile ? 'justify-center px-2' : 'px-4'
      )}>
        <Sparkles className="h-8 w-8 text-rose-400 flex-shrink-0" />
        {(!isCollapsed || isMobile) && (
          <span className="text-xl font-bold text-white">MedSpa</span>
        )}
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={() => setOpen(false)}
            className="ml-auto p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {visibleNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white',
                isCollapsed && !isMobile ? 'justify-center px-2' : 'px-3'
              )}
              title={isCollapsed && !isMobile ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {(!isCollapsed || isMobile) && item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-3">
        {user ? (
          <div className={cn('space-y-3', isCollapsed && !isMobile && 'space-y-2')}>
            {(!isCollapsed || isMobile) && (
              <div className="px-2">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400">
                  {isManager ? 'Manager' : 'Sales Rep'}
                </p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white',
                isCollapsed && !isMobile ? 'justify-center px-2' : 'px-3'
              )}
              title={isCollapsed && !isMobile ? 'Logout' : undefined}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {(!isCollapsed || isMobile) && 'Logout'}
            </button>
          </div>
        ) : (
          (!isCollapsed || isMobile) && (
            <p className="text-xs text-slate-500 px-2">Dashboard v1.0</p>
          )
        )}
      </div>

      {/* Collapse Toggle (Desktop only) */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      )}
    </>
  )

  // Mobile: Drawer with backdrop
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />

        {/* Drawer */}
        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 transition-transform duration-300 ease-in-out',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {sidebarContent}
        </div>
      </>
    )
  }

  // Desktop/Tablet: Fixed sidebar
  return (
    <div
      className={cn(
        'relative flex h-full flex-col bg-slate-900 transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {sidebarContent}
    </div>
  )
}
