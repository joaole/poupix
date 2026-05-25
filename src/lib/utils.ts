import type { Transaction, TransactionStatus, TransactionVM, Category } from '@/domain/types'

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime()
  return Math.round(ms / 86400000)
}

export function statusOf(t: Transaction, today: Date): TransactionStatus {
  if (t.paidAmount !== null && t.paidAmount !== undefined) return 'paid'
  if (startOfDay(new Date(t.scheduledDate)) < startOfDay(today)) return 'overdue'
  return 'pending'
}

export function toViewModel(t: Transaction, category: Category, today: Date): TransactionVM {
  return {
    ...t,
    category,
    status: statusOf(t, today),
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
