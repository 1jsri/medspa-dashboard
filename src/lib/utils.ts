import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const currencyCode = currency.toUpperCase() === 'CAD' ? 'CAD' : 'USD'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatDate(date: Date | string): string {
  if (!date) return '-'

  let d: Date
  if (typeof date === 'string') {
    // For ISO date strings like '2024-01-06', parse as local date
    // Avoid timezone issues by treating the date string as local time
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Parse YYYY-MM-DD format explicitly as local date
      const [year, month, day] = date.split('-').map(Number)
      d = new Date(year, month - 1, day)
    } else {
      // For other date formats, use standard parsing
      d = new Date(date)
    }
  } else {
    d = date
  }

  // Validate the date
  if (isNaN(d.getTime())) return '-'

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
