import { Sidebar } from '@/components/layout/sidebar'
import { DateFilterProvider } from '@/contexts/date-filter-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DateFilterProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </DateFilterProvider>
  )
}
