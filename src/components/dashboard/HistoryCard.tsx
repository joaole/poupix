import { useMemo } from 'react'
import type { MonthDataPoint } from '@/domain/types'
import type { MonthlySummary } from '@/domain/types'
import { formatBRLCompact } from '@/lib/formatters'
import { MONTH_NAMES_SHORT } from '@/lib/constants'

interface Props {
  history: MonthDataPoint[]
  currentMonth: string
  currentStats: MonthlySummary & { overdueCount: number }
}

export function HistoryCard({ history, currentMonth, currentStats }: Props) {
  const all = useMemo(() => {
    const monthIndex = parseInt(currentMonth.slice(5), 10) - 1
    const label = MONTH_NAMES_SHORT[monthIndex]
    return [
      ...history,
      {
        month: currentMonth,
        label: label.charAt(0).toUpperCase() + label.slice(1),
        income: currentStats.incomeConfirmed + currentStats.incomePending,
        expense: currentStats.expenseConfirmed + currentStats.expensePending,
        fixed: 0, variable: 0,
        incomeBySrc: {}, fixedByCategory: {}, variableByCategory: {},
        isCurrent: true,
      } as MonthDataPoint,
    ]
  }, [history, currentMonth, currentStats])

  const W = 600, H = 160, P = { l: 44, r: 16, t: 16, b: 28 }
  const innerW = W - P.l - P.r
  const innerH = H - P.t - P.b
  const max = Math.max(...all.flatMap(d => [d.income, d.expense])) * 1.1 || 1

  const x = (i: number) => P.l + (i / Math.max(all.length - 1, 1)) * innerW
  const y = (v: number) => P.t + innerH - (v / max) * innerH

  function pathFor(key: 'income' | 'expense') {
    return all.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d[key])}`).join(' ')
  }

  return (
    <div className="card history-card">
      <div className="card-header">
        <div>
          <div className="card-title">Evolução últimos meses</div>
          <div className="card-subtitle">receitas vs. gastos (mês corrente inclui pendentes)</div>
        </div>
        <div className="history-legend">
          <div className="row">
            <span className="swatch" style={{ background: 'var(--income-fg-soft)' }} /> Receitas
          </div>
          <div className="row">
            <span className="swatch" style={{ background: 'var(--expense-fg-soft)' }} /> Gastos
          </div>
        </div>
      </div>
      <div className="history-chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {[0, 0.25, 0.5, 0.75, 1].map(t => (
            <line
              key={t} className="grid"
              x1={P.l} x2={W - P.r}
              y1={P.t + innerH - t * innerH}
              y2={P.t + innerH - t * innerH}
            />
          ))}
          {[0, 0.5, 1].map(t => (
            <text key={t} x={P.l - 6} y={P.t + innerH - t * innerH + 3} textAnchor="end">
              {formatBRLCompact(max * t).replace('R$ ', '')}
            </text>
          ))}
          <path className="line-income" d={pathFor('income')} />
          <path className="line-expense" d={pathFor('expense')} />
          {all.map((d, i) => (
            <g key={i}>
              <circle className="dot-income" cx={x(i)} cy={y(d.income)} r={3.5} />
              <circle className="dot-expense" cx={x(i)} cy={y(d.expense)} r={3.5} />
              <text x={x(i)} y={H - 8} textAnchor="middle">{d.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
