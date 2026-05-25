import type { Transaction, MonthDataPoint, EvolutionInsights, Category } from '@/domain/types'
import { MONTH_NAMES_SHORT } from '@/lib/constants'

export class EvolutionService {
  buildMonthDataPoints(
    transactions: Transaction[],
    categories: Category[],
    currentMonth: string,
  ): MonthDataPoint[] {
    const catMap = new Map(categories.map(c => [c.id, c]))

    // Group by reference_month
    const byMonth: Record<string, Transaction[]> = {}
    for (const t of transactions) {
      if (!byMonth[t.referenceMonth]) byMonth[t.referenceMonth] = []
      byMonth[t.referenceMonth].push(t)
    }

    const months = Object.keys(byMonth).sort()

    return months.map(month => {
      const txs = byMonth[month]
      const incomeBySrc: Record<string, number> = {}
      const fixedByCategory: Record<string, number> = {}
      const variableByCategory: Record<string, number> = {}

      for (const t of txs) {
        const cat = catMap.get(t.categoryId)
        const slug = cat?.slug ?? 'outros'
        const amt = t.paidAmount !== null ? t.paidAmount : t.predictedAmount

        if (t.type === 'income') {
          incomeBySrc[slug] = (incomeBySrc[slug] ?? 0) + amt
        } else {
          if (t.isFixed) {
            fixedByCategory[slug] = (fixedByCategory[slug] ?? 0) + amt
          } else {
            variableByCategory[slug] = (variableByCategory[slug] ?? 0) + amt
          }
        }
      }

      const income = Object.values(incomeBySrc).reduce((s, v) => s + v, 0)
      const fixed = Object.values(fixedByCategory).reduce((s, v) => s + v, 0)
      const variable = Object.values(variableByCategory).reduce((s, v) => s + v, 0)
      const mIndex = parseInt(month.slice(5), 10) - 1
      const short = MONTH_NAMES_SHORT[mIndex] ?? month
      const label = short.charAt(0).toUpperCase() + short.slice(1)

      return {
        month,
        label,
        income,
        expense: fixed + variable,
        fixed,
        variable,
        incomeBySrc,
        fixedByCategory,
        variableByCategory,
        isCurrent: month === currentMonth,
      }
    })
  }

  computeInsights(data: MonthDataPoint[]): EvolutionInsights | null {
    if (data.length < 2) return null

    const avgIncome = data.reduce((s, d) => s + d.income, 0) / data.length
    const avgExpense = data.reduce((s, d) => s + d.expense, 0) / data.length
    const avgSavings = avgIncome - avgExpense
    const savingsRate = avgIncome > 0 ? (avgSavings / avgIncome) * 100 : 0

    const withBalance = data.map(d => ({ ...d, balance: d.income - d.expense }))
    const best = withBalance.reduce((a, b) => (a.balance > b.balance ? a : b))
    const worst = withBalance.reduce((a, b) => (a.balance < b.balance ? a : b))

    const last = data[data.length - 1]
    const prev = data[data.length - 2]
    const expenseDelta = last.expense - prev.expense
    const expensePct = prev.expense > 0 ? (expenseDelta / prev.expense) * 100 : 0

    // Biggest category jump between last and prev months
    const allCats = new Set<string>()
    const sources = [last, prev]
    for (const d of sources) {
      for (const k of Object.keys({ ...d.fixedByCategory, ...d.variableByCategory })) {
        allCats.add(k)
      }
    }

    let biggestJump: EvolutionInsights['biggestJump'] = null
    for (const cat of Array.from(allCats)) {
      const lastTotal = (last.fixedByCategory[cat] ?? 0) + (last.variableByCategory[cat] ?? 0)
      const prevTotal = (prev.fixedByCategory[cat] ?? 0) + (prev.variableByCategory[cat] ?? 0)
      const delta = lastTotal - prevTotal
      if (Math.abs(delta) < 30) continue
      if (!biggestJump || Math.abs(delta) > Math.abs(biggestJump.delta)) {
        biggestJump = { cat, delta, prevTotal, lastTotal }
      }
    }

    return {
      avgIncome,
      avgExpense,
      avgSavings,
      savingsRate,
      best,
      worst,
      expenseDelta,
      expensePct,
      biggestJump,
      lastLabel: last.label,
      prevLabel: prev.label,
    }
  }

  topCategories(data: MonthDataPoint[], source: keyof Pick<MonthDataPoint, 'fixedByCategory' | 'variableByCategory' | 'incomeBySrc'>, n: number): string[] {
    const totals: Record<string, number> = {}
    for (const d of data) {
      for (const [k, v] of Object.entries(d[source] ?? {})) {
        totals[k] = (totals[k] ?? 0) + v
      }
    }
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([id]) => id)
  }
}
