import type { TransactionStatus } from '@/domain/types'

interface Props {
  status: TransactionStatus
  daysLate?: number
}

export function StatusBadge({ status, daysLate }: Props) {
  if (status === 'paid') {
    return <span className="status-badge status-paid">baixado</span>
  }
  if (status === 'overdue') {
    return (
      <span className="status-badge status-overdue" title={daysLate ? `${daysLate} dia(s) em atraso` : undefined}>
        vencido
      </span>
    )
  }
  return <span className="status-badge status-pending">pendente</span>
}
