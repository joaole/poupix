// Sidebar — shadcn-style left navigation
// Exposes: window.Sidebar

(function () {
  const { useState, useRef, useEffect } = React;

  function Sidebar({ active, onNavigate, user, onLogout }) {
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
            kbd="1" />
          
          <NavItem
            icon="trending"
            label="Evolução mensal"
            description="Comportamento ao longo do tempo"
            active={active === 'evolution'}
            onClick={() => onNavigate('evolution')}
            kbd="2" />
          
        </div>

        <div className="sidebar-section" style={{ marginTop: 'auto' }}>
          <UserCard user={user} onLogout={onLogout} />
        </div>
      </aside>);

  }

  function NavItem({ icon, label, description, active, onClick, kbd }) {
    return (
      <button
        className={`nav-item ${active ? 'active' : ''}`}
        onClick={onClick}>
        
        <span className="nav-icon"><Icon name={icon} size={15} /></span>
        <span className="nav-text">
          <span className="nav-label">{label}</span>
          {description && <span className="nav-desc">{description}</span>}
        </span>
        {kbd && <kbd className="nav-kbd">{kbd}</kbd>}
      </button>);

  }

  function UserCard({ user, onLogout }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      if (!open) return;
      function click(e) {if (ref.current && !ref.current.contains(e.target)) setOpen(false);}
      function esc(e) {if (e.key === 'Escape') setOpen(false);}
      document.addEventListener('mousedown', click);
      document.addEventListener('keydown', esc);
      return () => {
        document.removeEventListener('mousedown', click);
        document.removeEventListener('keydown', esc);
      };
    }, [open]);

    const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

    return (
      <div className="user-card-wrap" ref={ref}>
        {open &&
        <div className="user-menu" role="menu">
            <div className="user-menu-header">
              <div className="avatar lg">{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
            <div className="user-menu-sep"></div>
            <button className="user-menu-item danger" onClick={onLogout}>
              <Icon name="arrowUp" size={13} /> Sair
            </button>
          </div>
        }
        <button className={`user-card ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}>
          <div className="avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name" data-comment-anchor="556aa35188-div-109-13">{user.name}</div>
            <div className="user-email">{user.email}</div>
          </div>
          <span className="user-chev">
            <Icon name="chevronDown" size={12} />
          </span>
        </button>
      </div>);

  }

  window.Sidebar = Sidebar;
})();