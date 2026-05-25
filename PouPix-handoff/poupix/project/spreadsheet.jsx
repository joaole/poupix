// Spreadsheet view — Tela 1
// Exposes: window.Spreadsheet

(function () {
  const { useState, useEffect, useMemo, useRef } = React;

  function Spreadsheet({
    entries,
    monthKey,
    today,
    density,
    masked,
    onUpdate,
    onConfirm,    // open baixa modal
    onQuickPaid,  // quick mark paid at full preview amount
    onUndo,
    onDelete,
    onAdd,
  }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [kindFilter, setKindFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const searchRef = useRef(null);

    // Keyboard shortcut: / focuses search
    useEffect(() => {
      function handler(e) {
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault();
          searchRef.current && searchRef.current.focus();
        }
      }
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, []);

    const filtered = useMemo(() => {
      const s = search.trim().toLowerCase();
      return entries.filter(e => {
        if (kindFilter !== 'all' && e.kind !== kindFilter) return false;
        if (typeFilter !== 'all' && e.type !== typeFilter) return false;
        const status = PPx.statusOf(e, today);
        if (statusFilter !== 'all' && status !== statusFilter) return false;
        if (s) {
          const cat = PPx.categoryById(e.category, e.kind);
          const hay = `${e.description} ${cat.label}`.toLowerCase();
          if (!hay.includes(s)) return false;
        }
        return true;
      });
    }, [entries, search, statusFilter, kindFilter, typeFilter, today]);

    // Summary
    const summary = useMemo(() => {
      let recPrev = 0, recConf = 0, gastoPrev = 0, gastoConf = 0;
      for (const e of entries) {
        if (e.kind === 'income') {
          recPrev += e.amount;
          if (e.paid !== null) recConf += e.paid;
        } else {
          gastoPrev += e.amount;
          if (e.paid !== null) gastoConf += e.paid;
        }
      }
      return { recPrev, recConf, gastoPrev, gastoConf, saldoConf: recConf - gastoConf, saldoPrev: recPrev - gastoPrev };
    }, [entries]);

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
            {search && <button className="icon-btn" onClick={() => setSearch('')}><Icon name="x" size={12} /></button>}
          </div>

          <FilterSelect icon="arrowUp" value={kindFilter} onChange={setKindFilter}
            options={[['all', 'Tipo: tudo'], ['income', 'Só receitas'], ['expense', 'Só gastos']]} />
          <FilterSelect value={statusFilter} onChange={setStatusFilter}
            options={[['all', 'Status: tudo'], ['pending', 'Pendente'], ['overdue', 'Vencido'], ['paid', 'Baixado']]} />
          <FilterSelect icon="repeat" value={typeFilter} onChange={setTypeFilter}
            options={[['all', 'Fixo/Variável'], ['fixo', 'Só fixos'], ['variável', 'Só variáveis']]} />

          <div className="spacer"></div>
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
                <th className="center" style={{ width: 110 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ height: 80, textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  Nenhum lançamento corresponde aos filtros.
                </td></tr>
              )}
              {filtered.map(entry => (
                <Row
                  key={entry.id}
                  entry={entry}
                  today={today}
                  onUpdate={onUpdate}
                  onConfirm={onConfirm}
                  onQuickPaid={onQuickPaid}
                  onUndo={onUndo}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
            <AddRow monthKey={monthKey} onAdd={onAdd} />
          </table>

          <div className="sheet-summary">
            <div>
              <div className="label">Receitas confirmadas</div>
              <div className="value pos num">{PPx.formatBRL(summary.recConf)}</div>
            </div>
            <div>
              <div className="label">Gastos confirmados</div>
              <div className="value neg num">{PPx.formatBRL(summary.gastoConf)}</div>
            </div>
            <div>
              <div className="label">Saldo confirmado</div>
              <div className={`value num ${summary.saldoConf >= 0 ? 'pos' : 'neg'}`}>
                {PPx.formatBRL(summary.saldoConf)}
              </div>
            </div>
            <div>
              <div className="label">Saldo previsto (final do mês)</div>
              <div className={`value num ${summary.saldoPrev >= 0 ? 'pos' : 'neg'}`}>
                {PPx.formatBRL(summary.saldoPrev)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ Row ============
  function Row({ entry, today, onUpdate, onConfirm, onQuickPaid, onUndo, onDelete }) {
    const status = PPx.statusOf(entry, today);
    const cat = PPx.categoryById(entry.category, entry.kind);
    const cats = entry.kind === 'income' ? PouPixData.CATEGORIES.income : PouPixData.CATEGORIES.expense;

    function commit(field, value) {
      onUpdate(entry.id, { [field]: value });
    }

    return (
      <tr className={`${entry.kind} ${status === 'paid' ? 'paid-row' : ''}`}>
        <td className="mono dim">{PPx.formatDateShort(entry.date)}</td>
        <td className="cell-editable">
          <input
            type="text"
            value={entry.description}
            onChange={e => commit('description', e.target.value)}
          />
        </td>
        <td className="cell-editable">
          <select
            value={entry.category}
            onChange={e => commit('category', e.target.value)}
          >
            {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </td>
        <td>
          <span className="type-tag">{entry.type}</span>
        </td>
        <td className="num-col num cell-editable">
          <AmountCell
            value={entry.amount}
            onCommit={v => commit('amount', v)}
            color={entry.kind === 'expense' ? 'var(--expense-fg)' : 'var(--income-fg)'}
          />
        </td>
        <td className="num-col num" style={{
          color: entry.paid !== null ? (entry.kind === 'expense' ? 'var(--expense-fg)' : 'var(--income-fg)') : 'var(--text-tertiary)',
          fontWeight: entry.paid !== null ? 600 : 400,
        }}>
          {entry.paid !== null ? PPx.formatBRL(entry.paid) : '—'}
        </td>
        <td className="center">
          <StatusBadge status={status} entry={entry} today={today} />
        </td>
        <td>
          <div className="row-actions">
            {status === 'paid' ? (
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
    );
  }

  function AmountCell({ value, onCommit, color }) {
    const [draft, setDraft] = useState(formatForInput(value));
    const [editing, setEditing] = useState(false);

    useEffect(() => {
      if (!editing) setDraft(formatForInput(value));
    }, [value, editing]);

    function commit() {
      const n = PPx.parseAmountInput(draft);
      onCommit(n);
      setDraft(formatForInput(n));
      setEditing(false);
    }

    return (
      <input
        type="text"
        value={draft}
        style={{ color }}
        onFocus={() => setEditing(true)}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.target.blur(); }
          if (e.key === 'Escape') { setDraft(formatForInput(value)); setEditing(false); e.target.blur(); }
        }}
      />
    );
  }

  function formatForInput(n) {
    if (n === null || n === undefined) return '';
    return n.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // ============ Status badge ============
  function StatusBadge({ status, entry, today }) {
    if (status === 'paid') return <span className="status-badge status-paid">baixado</span>;
    if (status === 'overdue') {
      const days = PPx.daysBetween(entry.date, today);
      return <span className="status-badge status-overdue" title={`${days} dia(s) em atraso`}>vencido</span>;
    }
    return <span className="status-badge status-pending">pendente</span>;
  }

  // ============ Filter select chip ============
  function FilterSelect({ value, onChange, options, icon }) {
    return (
      <div className="filter-chip">
        {icon && <Icon name={icon} size={11} />}
        <select value={value} onChange={e => onChange(e.target.value)}>
          {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <span className="chev"><Icon name="chevronDown" size={10} /></span>
      </div>
    );
  }

  // ============ Add row ============
  function AddRow({ monthKey, onAdd }) {
    const [kind, setKind] = useState('expense');
    const [day, setDay] = useState('');
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState('mercado');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('variável');

    const cats = kind === 'income' ? PouPixData.CATEGORIES.income : PouPixData.CATEGORIES.expense;

    function submit() {
      if (!desc.trim()) return;
      const [y, m] = monthKey.split('-').map(Number);
      const dayN = parseInt(day, 10) || new Date().getDate();
      onAdd({
        kind, type,
        date: new Date(y, m - 1, Math.min(Math.max(dayN, 1), 28)),
        description: desc.trim(),
        category: cats.find(c => c.id === category) ? category : cats[0].id,
        amount: PPx.parseAmountInput(amount),
      });
      // reset
      setDay(''); setDesc(''); setAmount('');
    }

    function handleKey(e) {
      if (e.key === 'Enter') submit();
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
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {cats.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </td>
          <td>
            <select value={type} onChange={e => setType(e.target.value)}
              style={{ background: 'transparent', border: 0, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>
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
          <td></td>
          <td className="center">
            <div className="kind-toggle">
              <button className={`expense ${kind === 'expense' ? 'active' : ''}`} onClick={() => setKind('expense')}>gasto</button>
              <button className={`income ${kind === 'income' ? 'active' : ''}`} onClick={() => setKind('income')}>receita</button>
            </div>
          </td>
          <td className="center">
            <button className="add-submit" onClick={submit}>adicionar</button>
          </td>
        </tr>
      </tfoot>
    );
  }

  window.Spreadsheet = Spreadsheet;
})();
