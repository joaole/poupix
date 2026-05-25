import type { TransactionVM } from '@/domain/types'
import { Icon } from '../ui/Icon'
import { formatBRL, formatDateFull } from '@/lib/formatters'
import { daysBetween } from '@/lib/utils'

interface Props {
  overdue: TransactionVM[]
  today: Date
  onConfirm: (entry: TransactionVM) => void
  onGoToSheet: () => void
}

export function OverdueCard({ overdue, today, onConfirm, onGoToSheet }: Props) {
  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div className="card-header">
        <div>
          <div className="card-title">
            Vencidos
            {overdue.length > 0 && (
              <span style={{
                marginLeft: 8, fontSize: 11, color: 'var(--overdue)',
                background: 'var(--overdue-bg)', padding: '1px 7px',
                borderRadius: 999, fontWeight: 500,
              }}>
                {overdue.length}
              </span>
            )}
          </div>
          <div className="card-subtitle">data passou e ainda não foram baixados</div>
        </div>
        {overdue.length > 0 && (
          <button className="btn ghost" onClick={onGoToSheet} style={{ fontSize: 12, padding: '4px 10px' }}>
            ver na planilha →
          </button>
        )}
      </div>
      {overdue.length === 0 ? (
        <div className="empty-state">
          <Icon name="check" size={18} stroke={2} />
          <div style={{ marginTop: 4 }}>tudo em dia 🎉</div>
        </div>
      ) : (
        <div className="overdue-list">
          {overdue.slice(0, 6).map(e => {
            const days = daysBetween(e.scheduledDate, today)
            return (
              <div className="overdue-item" key={e.id}>
                <div>
                  <div className="desc">{e.description}</div>
                  <div className="meta">
                    <span className="late">{days}d atrasado</span>
                    {' · '}venceu {formatDateFull(e.scheduledDate)}
                    {' · '}{e.category.name}
                  </div>
                </div>
                <div className={`amt num ${e.type === 'expense' ? 'expense' : 'income'}`}>
                  {e.type === 'expense' ? '-' : '+'}{formatBRL(e.predictedAmount)}
                </div>
                <button className="baixa-btn" onClick={() => onConfirm(e)}>
                  baixar
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
