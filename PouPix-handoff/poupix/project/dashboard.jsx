// Dashboard — Tela 2 (Painel Visual)
// Exposes: window.Dashboard

(function () {
  const { useMemo } = React;

  function Dashboard({ entries, monthKey, today, masked, history, onConfirm, onGoToSheet }) {
    const stats = useMemo(() => computeStats(entries, today), [entries, today]);

    return (
      <div className={`dash ${masked ? 'masked' : ''}`}>
        <KpiGrid stats={stats} />
        <BudgetCard stats={stats} />
        <CategoriesCard stats={stats} />
        <DonutCard stats={stats} />
        <OverdueCard overdue={stats.overdue} today={today} onConfirm={onConfirm} onGoToSheet={onGoToSheet} />
        <HistoryCard history={history} currentMonth={monthKey} currentStats={stats} />
      </div>
    );
  }

  function computeStats(entries, today) {
    let incomeConfirmed = 0, expenseConfirmed = 0;
    let incomePending = 0, expensePending = 0;
    let incomeTotal = 0, expenseTotal = 0;
    const byCategory = {};
    const overdue = [];

    for (const e of entries) {
      if (e.kind === 'income') incomeTotal += e.amount;
      else expenseTotal += e.amount;

      const status = PPx.statusOf(e, today);
      if (status === 'paid') {
        if (e.kind === 'income') incomeConfirmed += e.paid;
        else expenseConfirmed += e.paid;
      } else {
        if (e.kind === 'income') incomePending += e.amount;
        else expensePending += e.amount;
        if (status === 'overdue') overdue.push(e);
      }

      if (e.kind === 'expense') {
        const amt = e.paid !== null ? e.paid : e.amount;
        byCategory[e.category] = (byCategory[e.category] || 0) + amt;
      }
    }

    const categories = Object.entries(byCategory)
      .map(([id, value]) => {
        const cat = PPx.categoryById(id, 'expense');
        return { ...cat, value };
      })
      .sort((a, b) => b.value - a.value);

    return {
      incomeConfirmed, expenseConfirmed,
      incomePending, expensePending,
      incomeTotal, expenseTotal,
      balanceConfirmed: incomeConfirmed - expenseConfirmed,
      balanceProjected: incomeTotal - expenseTotal,
      categories,
      overdue: overdue.sort((a, b) => a.date - b.date),
      budgetUsedPct: incomeConfirmed > 0 ? (expenseConfirmed / incomeConfirmed) * 100 : 0,
    };
  }

  // ============ KPIs ============
  function KpiGrid({ stats }) {
    const balPos = stats.balanceConfirmed >= 0;
    return (
      <div className="kpi-grid">
        <div className="kpi-card income">
          <div className="kpi-label"><Icon name="arrowDown" size={12} /> Receitas confirmadas</div>
          <div className="kpi-value">{PPx.formatBRL(stats.incomeConfirmed)}</div>
          <div className="kpi-sub">
            + {PPx.formatBRL(stats.incomePending)} a receber
          </div>
        </div>
        <div className="kpi-card expense">
          <div className="kpi-label"><Icon name="arrowUp" size={12} /> Gastos confirmados</div>
          <div className="kpi-value">{PPx.formatBRL(stats.expenseConfirmed)}</div>
          <div className="kpi-sub">
            + {PPx.formatBRL(stats.expensePending)} a pagar
          </div>
        </div>
        <div className={`kpi-card balance ${balPos ? 'pos' : 'neg'}`}>
          <div className="kpi-label"><Icon name="wallet" size={12} /> Saldo do mês</div>
          <div className="kpi-value">{PPx.formatBRL(stats.balanceConfirmed)}</div>
          <div className="kpi-sub">
            previsto final: <span style={{ color: stats.balanceProjected >= 0 ? 'var(--income-fg)' : 'var(--expense-fg)' }}>
              {PPx.formatBRL(stats.balanceProjected)}
            </span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label"><Icon name="alert" size={12} /> Pendências</div>
          <div className="kpi-value" style={{ color: stats.overdue.length > 0 ? 'var(--overdue)' : 'var(--text)' }}>
            {stats.overdue.length}
          </div>
          <div className="kpi-sub">
            {stats.overdue.length === 0 ? 'tudo em dia' : `${stats.overdue.length} vencido(s)`}
          </div>
        </div>
      </div>
    );
  }

  // ============ Budget progress ============
  function BudgetCard({ stats }) {
    const pct = Math.min(stats.budgetUsedPct, 100);
    const projectedPct = stats.incomeTotal > 0 ? (stats.expenseTotal / stats.incomeTotal) * 100 : 0;
    return (
      <div className="card budget-card">
        <div className="card-header">
          <div>
            <div className="card-title">Quanto do que entrou já foi gasto</div>
            <div className="card-subtitle">
              <span className="num">{PPx.formatBRL(stats.expenseConfirmed)}</span> de <span className="num">{PPx.formatBRL(stats.incomeConfirmed)}</span> ({pct.toFixed(0)}%)
            </div>
          </div>
          <div style={{
            fontSize: 11, color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-mono)',
          }}>
            projeção final: {projectedPct.toFixed(0)}%
          </div>
        </div>
        <div className="budget-track">
          <div className="budget-fill" style={{ width: `${pct}%` }}></div>
          {projectedPct > pct && projectedPct <= 100 && (
            <div className="budget-marker" style={{ left: `${Math.min(projectedPct, 100)}%` }}></div>
          )}
        </div>
        <div className="budget-stats">
          <span>0%</span>
          <span style={{ color: pct > 80 ? 'var(--overdue)' : pct > 50 ? 'var(--pending)' : 'var(--text-secondary)' }}>
            {pct >= 100 ? '⚠ ultrapassou o que entrou' :
             pct >= 90 ? 'cuidado — quase no limite' :
             pct >= 70 ? 'atenção ao ritmo' :
             'no ritmo'}
          </span>
          <span>100%</span>
        </div>
      </div>
    );
  }

  // ============ Categories bar list ============
  function CategoriesCard({ stats }) {
    const total = stats.categories.reduce((s, c) => s + c.value, 0);
    return (
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Gastos por categoria</div>
            <div className="card-subtitle">incluindo pendentes</div>
          </div>
        </div>
        {stats.categories.length === 0 ? (
          <div className="empty-state">sem gastos no mês ainda</div>
        ) : (
          <div className="cat-list">
            {stats.categories.slice(0, 7).map(c => {
              const pct = total > 0 ? (c.value / total) * 100 : 0;
              return (
                <div className="cat-row" key={c.id}>
                  <div className="top">
                    <div className="name">
                      <span className="dot" style={{ background: c.color }}></span>
                      {c.label}
                    </div>
                    <div>
                      <span className="val">{PPx.formatBRL(c.value)}</span>
                      <span className="pct" style={{ marginLeft: 8 }}>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${pct}%`, background: c.color }}></i>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============ Donut ============
  function DonutCard({ stats }) {
    const total = stats.categories.reduce((s, c) => s + c.value, 0);
    const R = 52, STROKE = 16, CX = 66, CY = 66;
    const C = 2 * Math.PI * R;

    let offset = 0;
    const segments = stats.categories.slice(0, 6).map((c, i) => {
      const pct = total > 0 ? c.value / total : 0;
      const len = C * pct;
      const seg = {
        ...c,
        dasharray: `${len} ${C - len}`,
        dashoffset: -offset,
      };
      offset += len;
      return seg;
    });
    // Bucket remaining as "outros"
    const rest = stats.categories.slice(6);
    if (rest.length) {
      const sum = rest.reduce((s, c) => s + c.value, 0);
      const pct = total > 0 ? sum / total : 0;
      const len = C * pct;
      segments.push({
        id: '_rest', label: `+${rest.length} outras`, color: 'var(--text-tertiary)', value: sum,
        dasharray: `${len} ${C - len}`,
        dashoffset: -offset,
      });
    }

    return (
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Distribuição</div>
            <div className="card-subtitle">{stats.categories.length} categorias</div>
          </div>
        </div>
        {total === 0 ? (
          <div className="empty-state">sem gastos ainda</div>
        ) : (
          <div className="donut-wrap">
            <div className="donut">
              <svg viewBox="0 0 132 132">
                <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--bg-subtle)" strokeWidth={STROKE} />
                {segments.map(s => (
                  <circle key={s.id}
                    cx={CX} cy={CY} r={R}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={STROKE}
                    strokeDasharray={s.dasharray}
                    strokeDashoffset={s.dashoffset}
                  />
                ))}
              </svg>
              <div className="donut-center">
                <div className="total">{PPx.formatBRLcompact(total)}</div>
                <div className="lbl">total</div>
              </div>
            </div>
            <div className="donut-legend">
              {segments.slice(0, 5).map(s => {
                const pct = total > 0 ? (s.value / total) * 100 : 0;
                return (
                  <div className="row" key={s.id}>
                    <span className="swatch" style={{ background: s.color }}></span>
                    <span className="nm">{s.label}</span>
                    <span className="vl">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============ Overdue list ============
  function OverdueCard({ overdue, today, onConfirm, onGoToSheet }) {
    return (
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-header">
          <div>
            <div className="card-title">
              Vencidos
              {overdue.length > 0 && <span style={{
                marginLeft: 8,
                fontSize: 11, color: 'var(--overdue)',
                background: 'var(--overdue-bg)',
                padding: '1px 7px', borderRadius: 999,
                fontWeight: 500,
              }}>{overdue.length}</span>}
            </div>
            <div className="card-subtitle">data passou e ainda não foram baixados</div>
          </div>
          {overdue.length > 0 && (
            <button className="btn ghost" onClick={onGoToSheet} style={{ fontSize: 12, padding: '4px 10px' }}>
              ver na planilha →
            </button>
          )}
        </div>
        {overdue.length === 0 ? (
          <div className="empty-state">
            <Icon name="check" size={18} stroke={2} />
            <div style={{ marginTop: 4 }}>tudo em dia 🎉</div>
          </div>
        ) : (
          <div className="overdue-list">
            {overdue.slice(0, 6).map(e => {
              const days = PPx.daysBetween(e.date, today);
              return (
                <div className="overdue-item" key={e.id}>
                  <div>
                    <div className="desc">{e.description}</div>
                    <div className="meta">
                      <span className="late">{days}d atrasado</span> · venceu {PPx.formatDateFull(e.date)} · {PPx.categoryById(e.category, e.kind).label}
                    </div>
                  </div>
                  <div className={`amt num ${e.kind === 'expense' ? 'expense' : 'income'}`}>
                    {e.kind === 'expense' ? '-' : '+'}{PPx.formatBRL(e.amount)}
                  </div>
                  <button className="baixa-btn" onClick={() => onConfirm(e)}>
                    baixar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ============ History line chart ============
  function HistoryCard({ history, currentMonth, currentStats }) {
    const all = useMemo(() => {
      const arr = [...history];
      arr.push({
        month: currentMonth,
        label: PPx.MONTH_NAMES_SHORT[parseInt(currentMonth.slice(5), 10) - 1],
        income: currentStats.incomeConfirmed + currentStats.incomePending,
        expense: currentStats.expenseConfirmed + currentStats.expensePending,
      });
      return arr;
    }, [history, currentMonth, currentStats]);

    const W = 600, H = 160, P = { l: 44, r: 16, t: 16, b: 28 };
    const innerW = W - P.l - P.r;
    const innerH = H - P.t - P.b;
    const max = Math.max(...all.flatMap(d => [d.income, d.expense])) * 1.1;

    const x = (i) => P.l + (i / Math.max(all.length - 1, 1)) * innerW;
    const y = (v) => P.t + innerH - (v / max) * innerH;

    function pathFor(key) {
      return all.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d[key])}`).join(' ');
    }

    return (
      <div className="card history-card">
        <div className="card-header">
          <div>
            <div className="card-title">Evolução últimos meses</div>
            <div className="card-subtitle">receitas vs. gastos (mês corrente inclui pendentes)</div>
          </div>
          <div className="history-legend">
            <div className="row"><span className="swatch" style={{ background: 'var(--income-fg-soft)' }}></span> Receitas</div>
            <div className="row"><span className="swatch" style={{ background: 'var(--expense-fg-soft)' }}></span> Gastos</div>
          </div>
        </div>
        <div className="history-chart">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            {/* y axis grid */}
            {[0, 0.25, 0.5, 0.75, 1].map(t => (
              <line key={t}
                className="grid"
                x1={P.l} x2={W - P.r}
                y1={P.t + innerH - t * innerH}
                y2={P.t + innerH - t * innerH} />
            ))}
            {[0, 0.5, 1].map(t => (
              <text key={t}
                x={P.l - 6}
                y={P.t + innerH - t * innerH + 3}
                textAnchor="end">
                {PPx.formatBRLcompact(max * t).replace('R$ ', '')}
              </text>
            ))}
            {/* Lines */}
            <path className="line-income" d={pathFor('income')} />
            <path className="line-expense" d={pathFor('expense')} />
            {/* Dots */}
            {all.map((d, i) => (
              <g key={i}>
                <circle className="dot-income" cx={x(i)} cy={y(d.income)} r={3.5} />
                <circle className="dot-expense" cx={x(i)} cy={y(d.expense)} r={3.5} />
                <text x={x(i)} y={H - 8} textAnchor="middle">{d.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  }

  window.Dashboard = Dashboard;
})();
