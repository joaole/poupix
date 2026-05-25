import { formatBRL } from '@/lib/formatters'
import type { MonthlySummary } from '@/domain/types'

interface Stats extends MonthlySummary {
  budgetUsedPct: number
}

export function BudgetCard({ stats }: { stats: Stats }) {
  const pct = Math.min(stats.budgetUsedPct, 100)
  const projectedPct = stats.incomeTotal > 0 ? (stats.expenseTotal / stats.incomeTotal) * 100 : 0

  const message =
    pct >= 100 ? '⚠ ultrapassou o que entrou' :
    pct >= 90  ? 'cuidado — quase no limite' :
    pct >= 70  ? 'atenção ao ritmo' :
    'no ritmo'

  return (
    <div className="card budget-card">
      <div className="card-header">
        <div>
          <div className="card-title">Quanto do que entrou já foi gasto</div>
          <div className="card-subtitle">
            <span className="num">{formatBRL(stats.expenseConfirmed)}</span>{' '}
            de <span className="num">{formatBRL(stats.incomeConfirmed)}</span>{' '}
            ({pct.toFixed(0)}%)
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
          projeção final: {projectedPct.toFixed(0)}%
        </div>
      </div>
      <div className="budget-track">
        <div className="budget-fill" style={{ width: `${pct}%` }} />
        {projectedPct > pct && projectedPct <= 100 && (
          <div className="budget-marker" style={{ left: `${Math.min(projectedPct, 100)}%` }} />
        )}
      </div>
      <div className="budget-stats">
        <span>0%</span>
        <span style={{
          color: pct > 80 ? 'var(--overdue)' : pct > 50 ? 'var(--pending)' : 'var(--text-secondary)',
        }}>
          {message}
        </span>
        <span>100%</span>
      </div>
    </div>
  )
}
