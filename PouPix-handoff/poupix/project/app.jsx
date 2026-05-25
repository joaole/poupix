// PouPix main app
// Manages state, entries, navigation between months and tabs, baixa modal.

(function () {
  const { useState, useEffect, useMemo, useCallback } = React;

  const STORAGE_KEY = 'poupix.v1.state';

  // Tweaks defaults (editable on disk)
  const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
    "density": "comfortable",
    "accent": "zinc",
    "theme": "light",
    "showValues": true
  }/*EDITMODE-END*/;

  // ============ Persistence ============
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      // Rehydrate dates
      const overrides = {};
      for (const [k, v] of Object.entries(obj.overrides || {})) {
        overrides[k] = { ...v };
        if (v.date) overrides[k].date = new Date(v.date);
        if (v.paidDate) overrides[k].paidDate = new Date(v.paidDate);
      }
      const customAdds = (obj.customAdds || []).map(e => ({
        ...e,
        date: new Date(e.date),
        paidDate: e.paidDate ? new Date(e.paidDate) : null,
      }));
      return { overrides, customAdds, deleted: obj.deleted || [] };
    } catch (err) { return null; }
  }

  function saveState(state) {
    try {
      const serial = {
        overrides: state.overrides,
        customAdds: state.customAdds,
        deleted: state.deleted,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serial));
    } catch (err) { /* ignore */ }
  }

  // ============ App ============
  function App() {
    const [tweaks, setTweak] = useTweaks(TWEAKS_DEFAULTS);
    const [view, setView] = useState('month'); // 'month' | 'evolution'
    const [tab, setTab] = useState('sheet'); // within 'month' view
    const [monthKey, setMonthKey] = useState(PPx.monthKey(PouPixData.TODAY));
    const [loggedOut, setLoggedOut] = useState(false);

    const user = {
      name: 'Marina Souza',
      email: 'marina.souza@email.com',
    };

    // Initial state
    const initial = useMemo(() => loadState() || { overrides: {}, customAdds: [], deleted: [] }, []);
    const [overrides, setOverrides] = useState(initial.overrides);
    const [customAdds, setCustomAdds] = useState(initial.customAdds);
    const [deleted, setDeleted] = useState(initial.deleted);
    const [modalEntry, setModalEntry] = useState(null);

    useEffect(() => {
      saveState({ overrides, customAdds, deleted });
    }, [overrides, customAdds, deleted]);

    // Apply theme
    useEffect(() => {
      document.documentElement.setAttribute('data-theme', tweaks.theme || 'light');
      // Accent overrides
      const root = document.documentElement;
      const accents = {
        zinc: { text: '#18181b', textDark: '#f4f4f5' },
        indigo: { text: '#4338ca', textDark: '#a5b4fc' },
        emerald: { text: '#047857', textDark: '#6ee7b7' },
        amber: { text: '#b45309', textDark: '#fcd34d' },
      };
      // For Notion/Linear feel we keep accent as text/border color
      // (intentionally minimal — accent shows on tab underline and primary buttons)
    }, [tweaks.theme]);

    // Build entries for current month
    const entries = useMemo(() => {
      const base = PouPixData.buildEntriesForMonth(monthKey);
      // Apply overrides
      const merged = base.map(e => {
        const ov = overrides[e.id];
        if (!ov) return e;
        return { ...e, ...ov };
      }).filter(e => !deleted.includes(e.id));
      // Append custom (variable) adds for this month
      for (const c of customAdds) {
        if (PPx.monthKey(c.date) === monthKey && !deleted.includes(c.id)) {
          merged.push(c);
        }
      }
      return merged.sort((a, b) => a.date - b.date);
    }, [monthKey, overrides, customAdds, deleted]);

    // Today (sync to PouPixData.TODAY)
    const today = PouPixData.TODAY;

    // ============ Actions ============
    const updateEntry = useCallback((id, patch) => {
      setOverrides(o => ({ ...o, [id]: { ...(o[id] || {}), ...patch } }));
    }, []);

    const deleteEntry = useCallback((id) => {
      setDeleted(d => d.includes(id) ? d : [...d, id]);
    }, []);

    const quickPaid = useCallback((entry) => {
      const patch = {
        paid: entry.amount,
        paidDate: today < entry.date ? entry.date : today,
      };
      updateEntry(entry.id, patch);
    }, [updateEntry, today]);

    const undoPaid = useCallback((id) => {
      setOverrides(o => ({
        ...o,
        [id]: { ...(o[id] || {}), paid: null, paidDate: null, note: '', attachment: null },
      }));
    }, []);

    const addCustom = useCallback((data) => {
      const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const entry = {
        id,
        kind: data.kind,
        type: data.type,
        date: data.date,
        description: data.description,
        category: data.category,
        amount: data.amount,
        paid: null,
        paidDate: null,
        note: '',
        attachment: null,
      };
      setCustomAdds(arr => [...arr, entry]);
    }, []);

    const saveBaixa = useCallback((baixaData) => {
      if (!modalEntry) return;
      updateEntry(modalEntry.id, baixaData);
      setModalEntry(null);
    }, [modalEntry, updateEntry]);

    // ============ Month nav ============
    const shiftMonth = (delta) => setMonthKey(k => PPx.shiftMonth(k, delta));
    const goToday = () => setMonthKey(PPx.monthKey(today));

    // Counts for tab badge
    const overdueCount = entries.filter(e => PPx.statusOf(e, today) === 'overdue').length;

    // Keyboard: arrows shift month when not in input
    useEffect(() => {
      function handler(e) {
        const t = document.activeElement && document.activeElement.tagName;
        if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (e.key === 'ArrowLeft' && view === 'month') { shiftMonth(-1); }
        else if (e.key === 'ArrowRight' && view === 'month') { shiftMonth(1); }
        else if (e.key === 't' || e.key === 'T') { goToday(); }
        else if (e.key === '1') { setView('month'); }
        else if (e.key === '2') { setView('evolution'); }
      }
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [view]);

    // ============ Render ============
    if (loggedOut) {
      return (
        <div className="logout-screen">
          <div className="brand">
            <span className="brand-mark">P</span>
            <span style={{ fontSize: 18, fontWeight: 600 }}>PouPix</span>
          </div>
          <h2 style={{ marginTop: 32, marginBottom: 8 }}>Você saiu da sua conta</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 0, marginBottom: 24 }}>
            Seus dados continuam salvos localmente neste dispositivo.
          </p>
          <button className="btn primary" onClick={() => setLoggedOut(false)}>
            Entrar novamente
          </button>
        </div>
      );
    }

    return (
      <div className="app-shell">
        <Sidebar
          active={view}
          onNavigate={setView}
          user={user}
          onLogout={() => setLoggedOut(true)}
        />

        <main className="app-main">
          <header className="topbar">
            <div className="topbar-left">
              <h1 className="page-title">
                {view === 'month' ? 'Mês corrente' : 'Evolução mensal'}
              </h1>
              <span className="page-sub">
                {view === 'month'
                  ? 'Lançamentos e visão do mês selecionado'
                  : 'Comportamento ao longo do tempo · insights e gráficos'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {view === 'month' && (
                <div className="month-nav">
                  <button onClick={() => shiftMonth(-1)} title="Mês anterior (←)">
                    <Icon name="chevronLeft" size={14} />
                  </button>
                  <div className="month-label">{PPx.monthLabel(monthKey)}</div>
                  <button onClick={() => shiftMonth(1)} title="Próximo mês (→)">
                    <Icon name="chevronRight" size={14} />
                  </button>
                  {monthKey !== PPx.monthKey(today) && (
                    <button className="today-btn" onClick={goToday} title="Voltar para mês atual (T)">
                      hoje
                    </button>
                  )}
                </div>
              )}

              <button
                className="icon-btn"
                title={tweaks.showValues ? 'Esconder valores' : 'Mostrar valores'}
                onClick={() => setTweak('showValues', !tweaks.showValues)}
                style={{ width: 32, height: 32 }}
              >
                <Icon name={tweaks.showValues ? 'eye' : 'eyeOff'} size={15} />
              </button>
            </div>
          </header>

          {view === 'month' && (
            <>
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

              {tab === 'sheet' ? (
                <Spreadsheet
                  entries={entries}
                  monthKey={monthKey}
                  today={today}
                  density={tweaks.density}
                  masked={!tweaks.showValues}
                  onUpdate={updateEntry}
                  onConfirm={(e) => setModalEntry(e)}
                  onQuickPaid={quickPaid}
                  onUndo={undoPaid}
                  onDelete={deleteEntry}
                  onAdd={addCustom}
                />
              ) : (
                <Dashboard
                  entries={entries}
                  monthKey={monthKey}
                  today={today}
                  masked={!tweaks.showValues}
                  history={PouPixData.HISTORY_SUMMARY}
                  onConfirm={(e) => setModalEntry(e)}
                  onGoToSheet={() => setTab('sheet')}
                />
              )}
            </>
          )}

          {view === 'evolution' && (
            <Evolution
              today={today}
              currentMonthKey={monthKey}
              currentEntries={entries}
              masked={!tweaks.showValues}
            />
          )}
        </main>

        {modalEntry && (
          <BaixaModal
            entry={modalEntry}
            today={today}
            onClose={() => setModalEntry(null)}
            onSave={saveBaixa}
          />
        )}

        <TweaksPanel title="Tweaks">
          <TweakSection label="Aparência">
            <TweakRadio
              label="Tema"
              value={tweaks.theme}
              onChange={(v) => setTweak('theme', v)}
              options={[
                { value: 'light', label: 'claro' },
                { value: 'dark', label: 'escuro' },
              ]}
            />
            <TweakRadio
              label="Densidade da tabela"
              value={tweaks.density}
              onChange={(v) => setTweak('density', v)}
              options={[
                { value: 'compact', label: 'compacta' },
                { value: 'comfortable', label: 'confortável' },
              ]}
            />
            <TweakToggle
              label="Mostrar valores"
              value={tweaks.showValues}
              onChange={(v) => setTweak('showValues', v)}
            />
          </TweakSection>
          <TweakSection label="Dados">
            <TweakButton
              label="Resetar para o cenário inicial"
              onClick={() => {
                if (confirm('Apagar todas as edições e voltar ao cenário inicial?')) {
                  localStorage.removeItem(STORAGE_KEY);
                  location.reload();
                }
              }}
              secondary
            />
          </TweakSection>
        </TweaksPanel>
      </div>
    );
  }

  // Mount
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
})();
