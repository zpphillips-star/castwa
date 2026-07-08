import { type ClassValue, clsx } from 'clsx'
import { differenceInDays, parseISO, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function daysUntil(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date())
}

export function daysUntilClose(dateStr: string): number {
  return differenceInDays(parseISO(dateStr), new Date())
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy')
}

export function celsiusToFahrenheit(c: number): number {
  return Math.round((c * 9) / 5 + 32)
}

export function formatFlow(cfs: number): string {
  if (cfs >= 1000) return `${(cfs / 1000).toFixed(1)}K cfs`
  return `${Math.round(cfs)} cfs`
}

export function getSeasonStatus(
  openDate: string | null,
  closeDate: string | null
): { isOpen: boolean; label: string; urgency: 'normal' | 'soon' | 'closing' } {
  if (!openDate || !closeDate) {
    return { isOpen: false, label: 'Dates unknown', urgency: 'normal' }
  }
  const today = new Date()
  const open = parseISO(openDate)
  const close = parseISO(closeDate)

  if (today < open) {
    const days = differenceInDays(open, today)
    return {
      isOpen: false,
      label: days === 0 ? 'Opens today!' : `Opens in ${days} day${days !== 1 ? 's' : ''}`,
      urgency: days <= 7 ? 'soon' : 'normal',
    }
  }
  if (today > close) {
    return { isOpen: false, label: 'Season closed', urgency: 'normal' }
  }
  const daysLeft = differenceInDays(close, today)
  return {
    isOpen: true,
    label: daysLeft <= 1 ? 'Closes tomorrow!' : `Closes in ${daysLeft} days`,
    urgency: daysLeft <= 14 ? 'closing' : 'normal',
  }
}
