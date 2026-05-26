'use client'

import { useState, useRef, useEffect } from 'react'
import { Icon } from './ui/Icon'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type View = 'month' | 'evolution'

interface Props {
  active: View
  onNavigate: (view: View) => void
  userName: string
  userEmail: string
  onManageCategories: () => void
}

export function Sidebar({ active, onNavigate, userName, userEmail, onManageCategories }: Props) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark">P</span>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{ fontWeight: 600, fontSize: 13.5 }}>PouPix</span>
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>Finanças pessoais</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Visão geral</div>
        <NavItem
          icon="table"
          label="Mês corrente"
          description="Planilha e painel"
          active={active === 'month'}
          onClick={() => onNavigate('month')}
          kbd="1"
        />
        <NavItem
          icon="trending"
          label="Evolução mensal"
          description="Comportamento ao longo do tempo"
          active={active === 'evolution'}
          onClick={() => onNavigate('evolution')}
          kbd="2"
        />
      </div>

      <div className="sidebar-section" style={{ marginTop: 'auto' }}>
        <UserCard userName={userName} userEmail={userEmail} onManageCategories={onManageCategories} />
      </div>
    </aside>
  )
}

function NavItem({
  icon, label, description, active, onClick, kbd,
}: {
  icon: string; label: string; description: string
  active: boolean; onClick: () => void; kbd: string
}) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="nav-icon"><Icon name={icon} size={15} /></span>
      <span className="nav-text">
        <span className="nav-label">{label}</span>
        <span className="nav-desc">{description}</span>
      </span>
      <kbd className="nav-kbd">{kbd}</kbd>
    </button>
  )
}

function UserCard({ userName, userEmail, onManageCategories }: { userName: string; userEmail: string; onManageCategories: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    function click(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function esc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', click)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', click)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const initials = userName
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div className="user-card-wrap" ref={ref}>
      {open && (
        <div className="user-menu" role="menu">
          <div className="user-menu-header">
            <div className="avatar lg">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <div className="user-name">{userName}</div>
              <div className="user-email">{userEmail}</div>
            </div>
          </div>
          <button className="user-menu-item" onClick={() => { setOpen(false); onManageCategories() }}>
            <Icon name="sliders" size={13} /> Gerenciar categorias
          </button>
          <div className="user-menu-sep" />
          <button className="user-menu-item danger" onClick={handleLogout}>
            <Icon name="logOut" size={13} /> Sair da conta
          </button>
        </div>
      )}
      <button className={`user-card ${open ? 'open' : ''}`} onClick={() => setOpen(o => !o)}>
        <div className="avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{userName}</div>
          <div className="user-email">{userEmail}</div>
        </div>
        <span className="user-chev">
          <Icon name="chevronDown" size={12} />
        </span>
      </button>
    </div>
  )
}
