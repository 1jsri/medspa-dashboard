'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { DateFilterProvider } from '@/contexts/date-filter-context'
import { SidebarProvider, useSidebar } from '@/contexts/sidebar-context'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobile, toggle } = useSidebar()

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      <Sidebar />
      <main className={cn(
        'flex-1 overflow-y-auto transition-all duration-300',
        // Add left margin on desktop when sidebar is visible
        !isMobile && (isCollapsed ? 'ml-0' : 'ml-0')
      )}>
        {/* Mobile Header Bar */}
        {isMobile && (
          <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4">
            <button
              onClick={toggle}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
            <span className="font-semibold text-slate-900">MedSpa Dashboard</span>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <DateFilterProvider>
        <DashboardContent>{children}</DashboardContent>
      </DateFilterProvider>
    </SidebarProvider>
  )
}
