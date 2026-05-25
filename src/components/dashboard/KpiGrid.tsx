import { Icon } from '../ui/Icon'
import { formatBRL } from '@/lib/formatters'
import type { MonthlySummary } from '@/domain/types'

interface Stats extends MonthlySummary {
  overdueCount: number
}

export function KpiGrid({ stats }: { stats: Stats }) {
  const balPos = stats.balanceConfirmed >= 0
  return (
    <div className="kpi-grid">
      <div className="kpi-card income">
        <div className="kpi-label"><Icon name="arrowDown" size={12} /> Receitas confirmadas</div>
        <div className="kpi-value">{formatBRL(stats.incomeConfirmed)}</div>
        <div className="kpi-sub">+ {formatBRL(stats.incomePending)} a receber</div>
      </div>
      <div className="kpi-card expense">
        <div className="kpi-label"><Icon name="arrowUp" size={12} /> Gastos confirmados</div>
        <div className="kpi-value">{formatBRL(stats.expenseConfirmed)}</div>
        <div className="kpi-sub">+ {formatBRL(stats.expensePending)} a pagar</div>
      </div>
      <div className={`kpi-card balance ${balPos ? 'pos' : 'neg'}`}>
        <div className="kpi-label"><Icon name="wallet" size={12} /> Saldo do mês</div>
        <div className="kpi-value">{formatBRL(stats.balanceConfirmed)}</div>
        <div className="kpi-sub">
          previsto final:{' '}
          <span style={{ color: stats.balanceProjected >= 0 ? 'var(--income-fg)' : 'var(--expense-fg)' }}>
            {formatBRL(stats.balanceProjected)}
          </span>
        </div>
      </div>
      <div className="kpi-card">
        <div className="kpi-label"><Icon name="alert" size={12} /> Pendências</div>
        <div className="kpi-value" style={{ color: stats.overdueCount > 0 ? 'var(--overdue)' : 'var(--text)' }}>
          {stats.overdueCount}
        </div>
        <div className="kpi-sub">
          {stats.overdueCount === 0 ? 'tudo em dia' : `${stats.overdueCount} vencido(s)`}
        </div>
      </div>
    </div>
  )
}
