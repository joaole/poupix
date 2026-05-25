// Core domain types

export type TransactionType = 'income' | 'expense'
export type TransactionStatus = 'pending' | 'paid' | 'overdue'
export type TransactionKind = 'fixo' | 'variável'

export interface Category {
  id: string
  userId: string
  name: string
  type: TransactionType
  color: string
  slug: string
  createdAt: Date
}

export interface Transaction {
  id: string
  userId: string
  type: TransactionType
  description: string
  categoryId: string
  category?: Category
  isFixed: boolean
  fixedTemplateId: string | null
  referenceMonth: string   // YYYY-MM
  scheduledDate: Date
  predictedAmount: number
  paidAmount: number | null
  paidAt: Date | null
  notes: string
  attachmentUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface FixedTemplate {
  id: string
  userId: string
  type: TransactionType
  description: string
  categoryId: string
  category?: Category
  dayOfMonth: number
  predictedAmount: number
  isDynamic: boolean
  isActive: boolean
  createdAt: Date
}

// Derived view model — adds computed status, used across UI
export interface TransactionVM extends Transaction {
  status: TransactionStatus
  category: Category
}

export interface MonthlySummary {
  incomeConfirmed: number
  expenseConfirmed: number
  incomePending: number
  expensePending: number
  incomeTotal: number
  expenseTotal: number
  balanceConfirmed: number
  balanceProjected: number
  overdueCount: number
}

// For Evolution view
export interface MonthDataPoint {
  month: string   // YYYY-MM
  label: string   // "Jan", "Fev", …
  income: number
  expense: number
  fixed: number
  variable: number
  incomeBySrc: Record<string, number>
  fixedByCategory: Record<string, number>
  variableByCategory: Record<string, number>
  isCurrent: boolean
}

export interface EvolutionInsights {
  avgIncome: number
  avgExpense: number
  avgSavings: number
  savingsRate: number
  best: MonthDataPoint & { balance: number }
  worst: MonthDataPoint & { balance: number }
  expenseDelta: number
  expensePct: number
  biggestJump: {
    cat: string
    delta: number
    prevTotal: number
    lastTotal: number
  } | null
  lastLabel: string
  prevLabel: string
}

// Result type for repository methods
export type Result<T> = { data: T; error: null } | { data: null; error: Error }
