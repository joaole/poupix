'use client'

import { useState, useEffect, useRef } from 'react'
import type { TransactionVM } from '@/domain/types'
import type { BaixaInput } from '@/services/TransactionService'
import { Icon } from './ui/Icon'
import { formatBRL, formatAmountForInput, parseAmountInput, formatDateFull, toInputDate } from '@/lib/formatters'

interface Props {
  entry: TransactionVM
  today: Date
  onClose: () => void
  onSave: (data: BaixaInput, file?: File) => void
  isSaving?: boolean
}

export function BaixaModal({ entry, today, onClose, onSave, isSaving }: Props) {
  const [amount, setAmount] = useState(formatAmountForInput(entry.predictedAmount))
  const [date, setDate] = useState(toInputDate(entry.scheduledDate < today ? entry.scheduledDate : today))
  const [note, setNote] = useState(entry.notes ?? '')
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.select(), 50)
    function esc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  function save() {
    const paid = parseAmountInput(amount)
    const [y, m, d] = date.split('-').map(Number)
    onSave(
      { paidAmount: paid, paidAt: new Date(y, m - 1, d), notes: note.trim(), attachmentUrl: null },
      file ?? undefined,
    )
  }

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
  }

  const cat = entry.category
  const isIncome = entry.type === 'income'
  const diff = parseAmountInput(amount) - entry.predictedAmount

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="cat-dot" style={{ background: cat.color, width: 10, height: 10 }} />
            <div className="modal-title">
              {isIncome ? 'Confirmar recebimento' : 'Dar baixa'}
            </div>
          </div>
          <div className="modal-sub">
            {entry.description} · previsto {formatBRL(entry.predictedAmount)} em {formatDateFull(entry.scheduledDate)}
          </div>
        </div>

        <div className="modal-body">
          <div className="field-row">
            <div className="field">
              <label>{isIncome ? 'Valor recebido' : 'Valor pago'}</label>
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: isIncome ? 'var(--income-fg)' : 'var(--expense-fg)',
                }}
              />
              {Math.abs(diff) > 0.005 && (
                <div style={{
                  fontSize: 11,
                  color: diff > 0
                    ? (isIncome ? 'var(--income-fg)' : 'var(--expense-fg)')
                    : (isIncome ? 'var(--expense-fg)' : 'var(--income-fg)'),
                  fontFamily: 'var(--font-mono)',
                }}>
                  {diff > 0 ? '+' : ''}{formatBRL(diff)} vs. previsto
                </div>
              )}
              <div className="amount-suggest">
                <button type="button" onClick={() => setAmount(formatAmountForInput(entry.predictedAmount))}>
                  = previsto
                </button>
                <button type="button" onClick={() => setAmount(formatAmountForInput(Math.round(entry.predictedAmount)))}>
                  arredondar
                </button>
              </div>
            </div>
            <div className="field">
              <label>Data efetiva</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>
              Observação{' '}
              <span style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0 }}>
                (opcional)
              </span>
            </label>
            <textarea
              placeholder={isIncome ? 'ex: holerite com hora extra' : 'ex: vinho extra no mercado'}
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <div className="field">
            <label>
              {isIncome ? 'Holerite / comprovante' : 'Comprovante'}{' '}
              <span style={{ color: 'var(--text-tertiary)', textTransform: 'none', letterSpacing: 0 }}>
                (opcional)
              </span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: 'none' }}
              onChange={pickFile}
            />
            {file ? (
              <div className="attach-zone has-file">
                <Icon name="receipt" size={16} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500 }}>{file.name}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--paid)', opacity: 0.7 }}>
                    {Math.round(file.size / 1024)} kB
                  </div>
                </div>
                <button className="icon-btn" type="button" onClick={() => setFile(null)}>
                  <Icon name="x" size={12} />
                </button>
              </div>
            ) : (
              <div className="attach-zone" onClick={() => fileRef.current?.click()}>
                <Icon name="paperclip" size={14} />
                &nbsp;arraste ou clique para anexar
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn ghost" type="button" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button className="btn primary" type="button" onClick={save} disabled={isSaving}>
            {isSaving ? 'Salvando…' : isIncome ? 'Confirmar recebimento' : 'Confirmar pagamento'}
          </button>
        </div>
      </div>
    </div>
  )
}
