'use client'

import { useState } from 'react'
import type { Category } from '@/domain/types'
import type { CreateTransactionInput } from '@/services/TransactionService'
import { parseAmountInput } from '@/lib/formatters'

interface Props {
  month: string   // YYYY-MM
  categories: Category[]
  onAdd: (data: CreateTransactionInput) => void
}

export function AddRow({ month, categories, onAdd }: Props) {
  const [kind, setKind] = useState<'income' | 'expense'>('expense')
  const [day, setDay] = useState('')
  const [desc, setDesc] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [isFixed, setIsFixed] = useState(false)

  const cats = categories.filter(c => c.type === kind)

  function submit() {
    if (!desc.trim()) return
    const [y, m] = month.split('-').map(Number)
    const dayN = parseInt(day, 10) || new Date().getDate()
    const cat = cats.find(c => c.id === categoryId) ?? cats[0]
    if (!cat) return

    onAdd({
      type: kind,
      description: desc.trim(),
      categoryId: cat.id,
      isFixed,
      scheduledDate: new Date(y, m - 1, Math.min(Math.max(dayN, 1), 28)),
      referenceMonth: month,
      predictedAmount: parseAmountInput(amount),
      notes: '',
    })
    setDay(''); setDesc(''); setAmount('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') submit()
  }

  return (
    <tfoot>
      <tr className={`add-row ${kind === 'income' ? 'income-mode' : 'expense-mode'}`}>
        <td className="cell-editable">
          <input
            type="text"
            placeholder="dd"
            maxLength={2}
            value={day}
            style={{ width: 30, fontFamily: 'var(--font-mono)' }}
            onChange={e => setDay(e.target.value.replace(/\D/g, ''))}
            onKeyDown={handleKey}
          />
        </td>
        <td className="cell-editable">
          <input
            type="text"
            placeholder={kind === 'income' ? '+ receita…' : '+ gasto…'}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            onKeyDown={handleKey}
          />
        </td>
        <td className="cell-editable">
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </td>
        <td>
          <select
            value={isFixed ? 'fixo' : 'variável'}
            onChange={e => setIsFixed(e.target.value === 'fixo')}
            style={{ background: 'transparent', border: 0, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}
          >
            <option value="variável">variável</option>
            <option value="fixo">fixo</option>
          </select>
        </td>
        <td className="num-col cell-editable">
          <input
            type="text"
            placeholder="0,00"
            value={amount}
            style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={handleKey}
          />
        </td>
        <td />
        <td className="center">
          <div className="kind-toggle">
            <button
              type="button"
              className={`expense ${kind === 'expense' ? 'active' : ''}`}
              onClick={() => setKind('expense')}
            >
              gasto
            </button>
            <button
              type="button"
              className={`income ${kind === 'income' ? 'active' : ''}`}
              onClick={() => setKind('income')}
            >
              receita
            </button>
          </div>
        </td>
        <td className="center">
          <button type="button" className="add-submit" onClick={submit}>
            adicionar
          </button>
        </td>
      </tr>
    </tfoot>
  )
}
