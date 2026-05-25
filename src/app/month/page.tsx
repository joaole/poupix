'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sidebar } from '@/components/Sidebar'
import { MonthNav } from '@/components/ui/MonthNav'
import { Icon } from '@/components/ui/Icon'
import { Spreadsheet } from '@/components/spreadsheet/Spreadsheet'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { BaixaModal } from '@/components/BaixaModal'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useMonthNav } from '@/hooks/useMonthNav'
import { useTransactions, useCreateTransaction, useUpdateTransaction, useBaixa, useUndoBaixa, useDeleteTransaction } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useEvolution } from '@/hooks/useEvolution'
import { StorageRepository } from '@/repositories/StorageRepository'
import { StorageService } from '@/services/StorageService'
import { createClient } from '@/lib/supabase/client'
import type { TransactionVM, Transaction } from '@/domain/types'
import type { BaixaInput } from '@/services/TransactionService'
import { useRouter } from 'next/navigation'

type Tab = 'sheet' | 'dashboard'

export default function MonthPage() {
  const { user, loading: userLoading } = useCurrentUser()
  const [tab, setTab] = useState<Tab>('sheet')
  const [view, setView] = useState<'month' | 'evolution'>('month')
  const [masked, setMasked] = useState(false)
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [modalEntry, setModalEntry] = useState<TransactionVM | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const { currentMonth, prev, next, goToday, isToday, today } = useMonthNav()

  const userId = user?.id ?? ''
  const userName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Usuário'
  const userEmail = user?.email ?? ''

  const txQuery = useTransactions(userId || undefined, currentMonth, today)
  const catQuery = useCategories(userId || undefined)
  const evoQuery = useEvolution(userId || undefined, currentMonth)

  const createTx = useCreateTransaction(userId)
  const updateTx = useUpdateTransaction(userId, currentMonth)
  const baixa = useBaixa(userId, currentMonth)
  const undoBaixa = useUndoBaixa(userId, currentMonth)
  const deleteTx = useDeleteTransaction(userId, currentMonth)

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '1') { setView('month'); router.replace('/month') }
      if (e.key === '2') { setView('evolution'); router.replace('/evolution') }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

  const handleUpdate = useCallback((id: string, patch: Record<string, unknown>) => {
    updateTx.mutate({ id, patch: patch as Partial<Transaction> })
  }, [updateTx])

  const handleBaixa = useCallback(async (data: BaixaInput, file?: File) => {
    if (!modalEntry) return
    setIsSaving(true)
    try {
      let attachmentUrl: string | null = null
      if (file && userId) {
        const supabase = createClient()
        const storageService = new StorageService(new StorageRepository(supabase))
        const result = await storageService.uploadReceipt(userId, modalEntry.id, file)
        if (!result.error) attachmentUrl = result.data
      }
      await baixa.mutateAsync({ id: modalEntry.id, input: { ...data, attachmentUrl } })
      setModalEntry(null)
    } finally {
      setIsSaving(false)
    }
  }, [modalEntry, baixa, userId])

  const entries = txQuery.data ?? []
  const categories = catQuery.data ?? []
  const evolutionData = evoQuery.data ?? []
  const overdueCount = entries.filter(e => e.status === 'overdue').length

  if (userLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)' }}>
        <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Carregando…</div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={view}
        onNavigate={v => {
          setView(v)
          router.replace(v === 'month' ? '/month' : '/evolution')
        }}
        userName={userName}
        userEmail={userEmail}
      />

      <main className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">Mês corrente</h1>
            <span className="page-sub">Lançamentos e visão do mês selecionado</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <MonthNav
              currentMonth={currentMonth}
              isToday={isToday}
              onPrev={prev}
              onNext={next}
              onGoToday={goToday}
            />
            <button
              className="icon-btn"
              style={{ width: 32, height: 32 }}
              title={masked ? 'Mostrar valores' : 'Esconder valores'}
              onClick={() => setMasked(m => !m)}
            >
              <Icon name={masked ? 'eyeOff' : 'eye'} size={15} />
            </button>
          </div>
        </header>

        <nav className="tabs">
          <button className={`tab ${tab === 'sheet' ? 'active' : ''}`} onClick={() => setTab('sheet')}>
            <Icon name="table" size={13} /> Planilha
            <span className="tab-count">{entries.length}</span>
          </button>
          <button className={`tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
            <Icon name="pie" size={13} /> Painel
            {overdueCount > 0 && (
              <span className="tab-count" style={{ background: 'var(--overdue-bg)', color: 'var(--overdue)' }}>
                {overdueCount}
              </span>
            )}
          </button>
        </nav>

        {txQuery.isLoading || catQuery.isLoading ? (
          <div className="empty-state" style={{ marginTop: 48 }}>Carregando lançamentos…</div>
        ) : txQuery.error ? (
          <div className="empty-state" style={{ marginTop: 48, color: 'var(--overdue)' }}>
            Erro ao carregar dados. Verifique sua conexão.
          </div>
        ) : tab === 'sheet' ? (
          <Spreadsheet
            entries={entries}
            month={currentMonth}
            today={today}
            categories={categories}
            masked={masked}
            density={density}
            onUpdate={handleUpdate}
            onConfirm={setModalEntry}
            onQuickPaid={entry => baixa.mutate({ id: entry.id, input: { paidAmount: entry.predictedAmount, paidAt: today, notes: '', attachmentUrl: null } })}
            onUndo={id => undoBaixa.mutate(id)}
            onDelete={id => deleteTx.mutate(id)}
            onAdd={data => createTx.mutate(data)}
          />
        ) : (
          <Dashboard
            entries={entries}
            month={currentMonth}
            today={today}
            masked={masked}
            history={evolutionData.filter(d => !d.isCurrent)}
            onConfirm={setModalEntry}
            onGoToSheet={() => setTab('sheet')}
          />
        )}
      </main>

      {modalEntry && (
        <BaixaModal
          entry={modalEntry}
          today={today}
          onClose={() => setModalEntry(null)}
          onSave={handleBaixa}
          isSaving={isSaving}
        />
      )}
    </div>
  )
}
