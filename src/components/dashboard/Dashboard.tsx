'use client'

import { useMemo } from 'react'
import type { TransactionVM, MonthlySummary, MonthDataPoint } from '@/domain/types'
import { KpiGrid } from './KpiGrid'
import { BudgetCard } from './BudgetCard'
import { CategoriesCard } from './CategoriesCard'
import { DonutCard } from './DonutCard'
import { OverdueCard } from './OverdueCard'
import { HistoryCard } from './HistoryCard'

interface CategoryStat {
  id: string
  name: string
  color: string
  value: number
}

interface DashboardStats extends MonthlySummary {
  categories: CategoryStat[]
  overdue: TransactionVM[]
  budgetUsedPct: number
}

interface Props {
  entries: TransactionVM[]
  month: string
  today: Date
  masked: boolean
  history: MonthDataPoint[]
  onConfirm: (entry: TransactionVM) => void
  onGoToSheet: () => void
}

function computeStats(entries: TransactionVM[], today: Date): DashboardStats {
  let incomeConfirmed = 0, expenseConfirmed = 0
  let incomePending = 0, expensePending = 0
  let incomeTotal = 0, expenseTotal = 0
  const byCategory: Record<string, number> = {}
  const overdue: TransactionVM[] = []

  for (const e of entries) {
    if (e.type === 'income') incomeTotal += e.predictedAmount
    else expenseTotal += e.predictedAmount

    if (e.status === 'paid') {
      if (e.type === 'income') incomeConfirmed += e.paidAmount!
      else expenseConfirmed += e.paidAmount!
    } else {
      if (e.type === 'income') incomePending += e.predictedAmount
      else expensePending += e.predictedAmount
      if (e.status === 'overdue') overdue.push(e)
    }

    if (e.type === 'expense') {
      const amt = e.paidAmount !== null ? e.paidAmount : e.predictedAmount
      byCategory[e.categoryId] = (byCategory[e.categoryId] ?? 0) + amt
    }
  }

  const categories: CategoryStat[] = Object.entries(byCategory)
    .map(([id, value]) => {
      const cat = entries.find(e => e.categoryId === id)?.category
      return { id, name: cat?.name ?? id, color: cat?.color ?? '#888', value }
    })
    .sort((a, b) => b.value - a.value)

  return {
    incomeConfirmed, expenseConfirmed,
    incomePending, expensePending,
    incomeTotal, expenseTotal,
    balanceConfirmed: incomeConfirmed - expenseConfirmed,
    balanceProjected: incomeTotal - expenseTotal,
    overdueCount: overdue.length,
    categories,
    overdue: overdue.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime()),
    budgetUsedPct: incomeConfirmed > 0 ? (expenseConfirmed / incomeConfirmed) * 100 : 0,
  }
}

export function Dashboard({ entries, month, today, masked, history, onConfirm, onGoToSheet }: Props) {
  const stats = useMemo(() => computeStats(entries, today), [entries, today])

  return (
    <div className={`dash ${masked ? 'masked' : ''}`}>
      <KpiGrid stats={stats} />
      <BudgetCard stats={stats} />
      <CategoriesCard stats={stats} />
      <DonutCard stats={stats} />
      <OverdueCard overdue={stats.overdue} today={today} onConfirm={onConfirm} onGoToSheet={onGoToSheet} />
      <HistoryCard history={history} currentMonth={month} currentStats={stats} />
    </div>
  )
}
