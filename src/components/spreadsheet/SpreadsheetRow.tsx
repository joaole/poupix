'use client'

import type { TransactionVM, Category } from '@/domain/types'
import { AmountCell } from './AmountCell'
import { StatusBadge } from '../ui/StatusBadge'
import { Icon } from '../ui/Icon'
import { formatBRL, formatDateShort } from '@/lib/formatters'
import { daysBetween } from '@/lib/utils'

interface Props {
  entry: TransactionVM
  today: Date
  categories: Category[]
  onUpdate: (id: string, patch: Record<string, unknown>) => void
  onConfirm: (entry: TransactionVM) => void
  onQuickPaid: (entry: TransactionVM) => void
  onUndo: (id: string) => void
  onDelete: (id: string) => void
}

export function SpreadsheetRow({
  entry, today, categories, onUpdate, onConfirm, onQuickPaid, onUndo, onDelete,
}: Props) {
  const cats = categories.filter(c => c.type === entry.type)

  function commit(field: string, value: unknown) {
    onUpdate(entry.id, { [field]: value })
  }

  const daysLate = entry.status === 'overdue' ? daysBetween(entry.scheduledDate, today) : undefined

  return (
    <tr className={`${entry.type} ${entry.status === 'paid' ? 'paid-row' : ''}`}>
      <td className="mono dim">{formatDateShort(entry.scheduledDate)}</td>
      <td className="cell-editable">
        <input
          type="text"
          value={entry.description}
          onChange={e => commit('description', e.target.value)}
        />
      </td>
      <td className="cell-editable">
        <select
          value={entry.categoryId}
          onChange={e => commit('categoryId', e.target.value)}
        >
          {cats.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </td>
      <td>
        <span className="type-tag">{entry.isFixed ? 'fixo' : 'variável'}</span>
      </td>
      <td className="num-col num cell-editable">
        <AmountCell
          value={entry.predictedAmount}
          onCommit={v => commit('predictedAmount', v)}
          color={entry.type === 'expense' ? 'var(--expense-fg)' : 'var(--income-fg)'}
        />
      </td>
      <td
        className="num-col num"
        style={{
          color: entry.paidAmount !== null
            ? (entry.type === 'expense' ? 'var(--expense-fg)' : 'var(--income-fg)')
            : 'var(--text-tertiary)',
          fontWeight: entry.paidAmount !== null ? 600 : 400,
        }}
      >
        {entry.paidAmount !== null ? formatBRL(entry.paidAmount) : '—'}
      </td>
      <td className="center">
        <StatusBadge status={entry.status} daysLate={daysLate} />
      </td>
      <td>
        <div className="row-actions">
          {entry.status === 'paid' ? (
            <button className="icon-btn" title="Desfazer baixa" onClick={() => onUndo(entry.id)}>
              <Icon name="repeat" size={13} />
            </button>
          ) : (
            <button
              className="confirm-btn"
              title="Dar baixa"
              onClick={() => onConfirm(entry)}
            >
              <Icon name="check" size={11} stroke={2.5} />
              baixar
            </button>
          )}
          <button className="icon-btn" title="Excluir" onClick={() => onDelete(entry.id)}>
            <Icon name="trash" size={12} />
          </button>
        </div>
      </td>
    </tr>
  )
}
