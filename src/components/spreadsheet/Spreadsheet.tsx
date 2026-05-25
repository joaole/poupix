'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import type { TransactionVM, Category } from '@/domain/types'
import type { CreateTransactionInput } from '@/services/TransactionService'
import { SpreadsheetRow } from './SpreadsheetRow'
import { AddRow } from './AddRow'
import { Icon } from '../ui/Icon'
import { formatBRL } from '@/lib/formatters'

interface Props {
  entries: TransactionVM[]
  month: string
  today: Date
  categories: Category[]
  masked: boolean
  density: 'compact' | 'comfortable'
  onUpdate: (id: string, patch: Record<string, unknown>) => void
  onConfirm: (entry: TransactionVM) => void
  onQuickPaid: (entry: TransactionVM) => void
  onUndo: (id: string) => void
  onDelete: (id: string) => void
  onAdd: (data: CreateTransactionInput) => void
}

export function Spreadsheet({
  entries, month, today, categories, masked, density,
  onUpdate, onConfirm, onQuickPaid, onUndo, onDelete, onAdd,
}: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [kindFilter, setKindFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return entries.filter(e => {
      if (kindFilter !== 'all' && e.type !== kindFilter) return false
      if (typeFilter !== 'all') {
        const isFixed = e.isFixed ? 'fixo' : 'variável'
        if (isFixed !== typeFilter) return false
      }
      if (statusFilter !== 'all' && e.status !== statusFilter) return false
      if (s) {
        const hay = `${e.description} ${e.category.name}`.toLowerCase()
        if (!hay.includes(s)) return false
      }
      return true
    })
  }, [entries, search, statusFilter, kindFilter, typeFilter])

  const summary = useMemo(() => {
    let recPrev = 0, recConf = 0, gastoPrev = 0, gastoConf = 0
    for (const e of entries) {
      if (e.type === 'income') {
        recPrev += e.predictedAmount
        if (e.paidAmount !== null) recConf += e.paidAmount
      } else {
        gastoPrev += e.predictedAmount
        if (e.paidAmount !== null) gastoConf += e.paidAmount
      }
    }
    return { recPrev, recConf, gastoPrev, gastoConf, saldoConf: recConf - gastoConf, saldoPrev: recPrev - gastoPrev }
  }, [entries])

  return (
    <div className={`spreadsheet ${density === 'compact' ? 'compact' : ''} ${masked ? 'masked' : ''}`}>
      <div className="sheet-toolbar">
        <div className="search">
          <Icon name="search" size={14} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Buscar descrição ou categoria…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="icon-btn" type="button" onClick={() => setSearch('')}>
              <Icon name="x" size={12} />
            </button>
          )}
        </div>

        <FilterSelect
          value={kindFilter}
          onChange={setKindFilter}
          options={[['all', 'Tipo: tudo'], ['income', 'Só receitas'], ['expense', 'Só gastos']]}
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[['all', 'Status: tudo'], ['pending', 'Pendente'], ['overdue', 'Vencido'], ['paid', 'Baixado']]}
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          options={[['all', 'Fixo/Variável'], ['fixo', 'Só fixos'], ['variável', 'Só variáveis']]}
        />

        <div className="spacer" />
        <div className="kbd-hint">
          <kbd>/</kbd> buscar · <kbd>Enter</kbd> adicionar
        </div>
      </div>

      <div className="sheet-wrap">
        <table className="sheet">
          <thead>
            <tr>
              <th style={{ width: 84 }}>Data</th>
              <th>Descrição</th>
              <th style={{ width: 150 }}>Categoria</th>
              <th style={{ width: 78 }}>Tipo</th>
              <th className="num-col" style={{ width: 120 }}>Previsto</th>
              <th className="num-col" style={{ width: 120 }}>Realizado</th>
              <th className="center" style={{ width: 110 }}>Status</th>
              <th className="center" style={{ width: 120 }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ height: 80, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  Nenhum lançamento corresponde aos filtros.
                </td>
              </tr>
            )}
            {filtered.map(entry => (
              <SpreadsheetRow
                key={entry.id}
                entry={entry}
                today={today}
                categories={categories}
                onUpdate={onUpdate}
                onConfirm={onConfirm}
                onQuickPaid={onQuickPaid}
                onUndo={onUndo}
                onDelete={onDelete}
              />
            ))}
          </tbody>
          <AddRow month={month} categories={categories} onAdd={onAdd} />
        </table>

        <div className="sheet-summary">
          <div>
            <div className="label">Receitas confirmadas</div>
            <div className="value pos num">{formatBRL(summary.recConf)}</div>
          </div>
          <div>
            <div className="label">Gastos confirmados</div>
            <div className="value neg num">{formatBRL(summary.gastoConf)}</div>
          </div>
          <div>
            <div className="label">Saldo confirmado</div>
            <div className={`value num ${summary.saldoConf >= 0 ? 'pos' : 'neg'}`}>
              {formatBRL(summary.saldoConf)}
            </div>
          </div>
          <div>
            <div className="label">Saldo previsto (final do mês)</div>
            <div className={`value num ${summary.saldoPrev >= 0 ? 'pos' : 'neg'}`}>
              {formatBRL(summary.saldoPrev)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterSelect({
  value, onChange, options,
}: {
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <div className="filter-chip">
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <span className="chev"><Icon name="chevronDown" size={10} /></span>
    </div>
  )
}
