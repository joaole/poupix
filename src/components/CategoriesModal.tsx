'use client'

import { useState, useEffect, useRef } from 'react'
import type { Category, TransactionType } from '@/domain/types'
import type { CreateCategoryInput } from '@/hooks/useCategories'
import { Icon } from './ui/Icon'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#64748b', '#78716c',
]

type View = 'list' | 'add'

interface Props {
  categories: Category[]
  onClose: () => void
  onAdd: (input: CreateCategoryInput) => void
  isSaving?: boolean
  error?: string | null
}

export function CategoriesModal({ categories, onClose, onAdd, isSaving, error }: Props) {
  const [view, setView] = useState<View>('list')
  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [hexInput, setHexInput] = useState(PRESET_COLORS[0])
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (view === 'add') setView('list')
        else onClose()
      }
    }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [view, onClose])

  useEffect(() => {
    if (view === 'add') setTimeout(() => nameRef.current?.focus(), 50)
  }, [view])

  function selectColor(c: string) {
    setColor(c)
    setHexInput(c)
  }

  function handleHexChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setHexInput(v)
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor(v)
  }

  function handleNativeColor(e: React.ChangeEvent<HTMLInputElement>) {
    selectColor(e.target.value)
  }

  function handleSave() {
    if (!name.trim()) return
    onAdd({ name: name.trim(), type, color })
  }

  function resetForm() {
    setName('')
    setType('expense')
    selectColor(PRESET_COLORS[0])
  }

  function goToAdd() {
    resetForm()
    setView('add')
  }

  function goToList() {
    setView('list')
  }

  const income = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {view === 'list' ? (
          <CategoryListView
            income={income}
            expense={expense}
            onAdd={goToAdd}
            onClose={onClose}
          />
        ) : (
          <AddCategoryView
            nameRef={nameRef}
            name={name}
            type={type}
            color={color}
            hexInput={hexInput}
            isSaving={isSaving}
            error={error}
            onNameChange={setName}
            onTypeChange={setType}
            onColorSelect={selectColor}
            onHexChange={handleHexChange}
            onNativeColor={handleNativeColor}
            onBack={goToList}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  )
}

function CategoryListView({
  income,
  expense,
  onAdd,
  onClose,
}: {
  income: Category[]
  expense: Category[]
  onAdd: () => void
  onClose: () => void
}) {
  return (
    <>
      <div className="modal-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="modal-title">Categorias</div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <Icon name="x" size={14} />
          </button>
        </div>
        <div className="modal-sub">
          {income.length + expense.length} categorias cadastradas
        </div>
      </div>

      <div className="modal-body" style={{ gap: 16, maxHeight: 400, overflowY: 'auto' }}>
        {income.length > 0 && (
          <div className="cat-group">
            <div className="cat-group-label">Receitas</div>
            {income.map(c => <CategoryItem key={c.id} category={c} />)}
          </div>
        )}
        {expense.length > 0 && (
          <div className="cat-group">
            <div className="cat-group-label">Gastos</div>
            {expense.map(c => <CategoryItem key={c.id} category={c} />)}
          </div>
        )}
        {income.length === 0 && expense.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13, padding: '16px 0' }}>
            Nenhuma categoria ainda.
          </div>
        )}
      </div>

      <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
        <button className="btn primary" type="button" onClick={onAdd}>
          <Icon name="plus" size={13} /> Adicionar categoria
        </button>
      </div>
    </>
  )
}

function CategoryItem({ category }: { category: Category }) {
  return (
    <div className="cat-manage-item">
      <span
        className="cat-dot"
        style={{ background: category.color, width: 10, height: 10, borderRadius: 3, flexShrink: 0 }}
      />
      <span style={{ flex: 1, fontSize: 13 }}>{category.name}</span>
    </div>
  )
}

function AddCategoryView({
  nameRef,
  name,
  type,
  color,
  hexInput,
  isSaving,
  error,
  onNameChange,
  onTypeChange,
  onColorSelect,
  onHexChange,
  onNativeColor,
  onBack,
  onSave,
}: {
  nameRef: React.RefObject<HTMLInputElement>
  name: string
  type: TransactionType
  color: string
  hexInput: string
  isSaving?: boolean
  error?: string | null
  onNameChange: (v: string) => void
  onTypeChange: (v: TransactionType) => void
  onColorSelect: (c: string) => void
  onHexChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onNativeColor: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBack: () => void
  onSave: () => void
}) {
  return (
    <>
      <div className="modal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="icon-btn" type="button" onClick={onBack} title="Voltar">
            <Icon name="chevronLeft" size={14} />
          </button>
          <div className="modal-title">Nova categoria</div>
        </div>
        <div className="modal-sub" style={{ paddingLeft: 30 }}>Preencha os dados da nova categoria</div>
      </div>

      <div className="modal-body">
        <div className="field">
          <label>Nome</label>
          <input
            ref={nameRef}
            type="text"
            placeholder="ex: Academia, Streaming…"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSave() }}
          />
        </div>

        <div className="field">
          <label>Tipo</label>
          <div className="type-toggle">
            <button
              type="button"
              className={type === 'expense' ? 'active-expense' : ''}
              onClick={() => onTypeChange('expense')}
            >
              Gasto
            </button>
            <button
              type="button"
              className={type === 'income' ? 'active-income' : ''}
              onClick={() => onTypeChange('income')}
            >
              Receita
            </button>
          </div>
        </div>

        <div className="field">
          <label>Cor</label>
          <div className="color-presets">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                className={`color-swatch${color === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => onColorSelect(c)}
                title={c}
              />
            ))}
          </div>
          <div className="color-custom">
            <div className="color-preview" style={{ background: color }} />
            <input
              type="text"
              className="color-hex-input"
              value={hexInput}
              onChange={onHexChange}
              maxLength={7}
              placeholder="#000000"
              spellCheck={false}
            />
            <label className="color-native-btn" title="Abrir seletor de cor">
              <input type="color" value={color} onChange={onNativeColor} tabIndex={-1} />
              <Icon name="sliders" size={13} />
            </label>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: 'var(--overdue)', padding: '6px 10px', background: 'var(--overdue-bg)', borderRadius: 5 }}>
            {error}
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button className="btn ghost" type="button" onClick={onBack} disabled={isSaving}>
          Cancelar
        </button>
        <button
          className="btn primary"
          type="button"
          onClick={onSave}
          disabled={!name.trim() || isSaving}
        >
          {isSaving ? 'Salvando…' : 'Criar categoria'}
        </button>
      </div>
    </>
  )
}
