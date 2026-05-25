import { MONTH_NAMES, MONTH_NAMES_SHORT } from './constants'

export function formatBRL(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  const [int, dec] = abs.toFixed(2).split('.')
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${sign}R$ ${intFmt},${dec}`
}

export function formatBRLCompact(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—'
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs >= 1000) {
    return `${sign}R$ ${(abs / 1000).toFixed(1).replace('.', ',')}k`
  }
  return formatBRL(n)
}

export function parseAmountInput(str: string | number): number {
  if (typeof str === 'number') return str
  if (!str) return 0
  const cleaned = String(str).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? 0 : n
}

export function formatAmountForInput(n: number | null | undefined): string {
  if (n === null || n === undefined) return ''
  return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatDateShort(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatDateFull(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

export function toInputDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthFromKey(key: string): Date {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

export function monthLabel(key: string): string {
  const d = monthFromKey(key)
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

export function monthLabelShort(key: string): string {
  const d = monthFromKey(key)
  const short = MONTH_NAMES_SHORT[d.getMonth()]
  return short.charAt(0).toUpperCase() + short.slice(1)
}

export function shiftMonth(key: string, delta: number): string {
  const d = monthFromKey(key)
  d.setMonth(d.getMonth() + delta)
  return monthKey(d)
}
