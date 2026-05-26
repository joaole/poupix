'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Icon } from '@/components/ui/Icon'
import { Evolution } from '@/components/evolution/Evolution'
import { CategoriesModal } from '@/components/CategoriesModal'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useMonthNav } from '@/hooks/useMonthNav'
import { useEvolution } from '@/hooks/useEvolution'
import { useCategories, useCreateCategory } from '@/hooks/useCategories'

export default function EvolutionPage() {
  const { user, loading: userLoading } = useCurrentUser()
  const [masked, setMasked] = useState(false)
  const [showCategories, setShowCategories] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)
  const router = useRouter()

  const { currentMonth } = useMonthNav()
  const userId = user?.id ?? ''
  const userName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Usuário'
  const userEmail = user?.email ?? ''

  const evoQuery = useEvolution(userId || undefined, currentMonth)
  const catQuery = useCategories(userId || undefined)
  const createCat = useCreateCategory(userId)

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === '1') router.replace('/month')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [router])

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
        active="evolution"
        onNavigate={v => router.replace(v === 'month' ? '/month' : '/evolution')}
        userName={userName}
        userEmail={userEmail}
        onManageCategories={() => { setCategoryError(null); setShowCategories(true) }}
      />

      <main className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">Evolução mensal</h1>
            <span className="page-sub">Comportamento ao longo do tempo · insights e gráficos</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

        {evoQuery.isLoading || catQuery.isLoading ? (
          <div className="empty-state" style={{ marginTop: 48 }}>Carregando evolução…</div>
        ) : evoQuery.error ? (
          <div className="empty-state" style={{ marginTop: 48, color: 'var(--overdue)' }}>
            Erro ao carregar dados.
          </div>
        ) : (evoQuery.data?.length ?? 0) < 2 ? (
          <div className="empty-state" style={{ marginTop: 48 }}>
            <Icon name="trending" size={24} />
            <div style={{ marginTop: 8 }}>
              Adicione lançamentos em pelo menos 2 meses para ver a evolução.
            </div>
          </div>
        ) : (
          <Evolution
            data={evoQuery.data ?? []}
            categories={catQuery.data ?? []}
            masked={masked}
          />
        )}
      </main>

      {showCategories && (
        <CategoriesModal
          categories={catQuery.data ?? []}
          onClose={() => setShowCategories(false)}
          onAdd={input => {
            setCategoryError(null)
            createCat.mutate(input, {
              onSuccess: () => setShowCategories(false),
              onError: (e) => setCategoryError(e instanceof Error ? e.message : 'Erro ao salvar categoria'),
            })
          }}
          isSaving={createCat.isPending}
          error={categoryError}
        />
      )}
    </div>
  )
}
