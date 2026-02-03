'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isOpen: boolean
  isCollapsed: boolean
  isMobile: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false) // Mobile drawer open state
  const [isCollapsed, setIsCollapsed] = useState(false) // Desktop collapsed state
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive breakpoints
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768

      setIsMobile(mobile)

      // Close mobile drawer when resizing to desktop
      if (!mobile && isOpen) {
        setIsOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isOpen])

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isMobile, isOpen])

  const toggle = useCallback(() => {
    if (isMobile) {
      setIsOpen((prev) => !prev)
    } else {
      setIsCollapsed((prev) => !prev)
    }
  }, [isMobile])

  const handleSetOpen = useCallback((open: boolean) => {
    setIsOpen(open)
  }, [])

  const handleSetCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed)
  }, [])

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isCollapsed,
        isMobile,
        toggle,
        setOpen: handleSetOpen,
        setCollapsed: handleSetCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
