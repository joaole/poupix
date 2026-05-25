// Evolution view — comportamento mês a mês com insights e gráficos
// Exposes: window.Evolution

(function () {
  const { useMemo, useState } = React;

  function Evolution({ today, currentMonthKey, currentEntries, masked }) {
    // Build dataset: HISTORY_DETAILED + current month (computed live)
    const data = useMemo(() => buildDataset(currentEntries, currentMonthKey), [currentEntries, currentMonthKey]);
    const insights = useMemo(() => computeInsights(data), [data]);

    const [range, setRange] = useState('all'); // 'all' | '3m' | '6m'
    const filtered = useMemo(() => {
      if (range === 'all') return data;
      const n = range === '3m' ? 3 : 6;
      return data.slice(-n);
    }, [data, range]);

    return (
      <div className={`evolution ${masked ? 'masked' : ''}`}>
        <header className="view-header">
          <div>
            <p className="view-subtitle">Como sua vida financeira se comportou nos últimos meses</p>
          </div>
          <div className="range-tabs">
            <RangeTab value="3m" active={range === '3m'} onClick={() => setRange('3m')}>3m</RangeTab>
            <RangeTab value="6m" active={range === '6m'} onClick={() => setRange('6m')}>6m</RangeTab>
            <RangeTab value="all" active={range === 'all'} onClick={() => setRange('all')}>tudo</RangeTab>
          </div>
        </header>

        <InsightsStrip insights={insights} />

        <TotalChart data={filtered} />

        <div className="evo-grid-2">
          <FixedExpensesChart data={filtered} />
          <VariableExpensesChart data={filtered} />
        </div>

        <IncomeChart data={filtered} />

        <SavingsTable data={filtered} />
      </div>
    );
  }

  // ============ Build dataset ============
  function buildDataset(currentEntries, currentMonthKey) {
    // Detailed historical months
    const history = PouPixData.HISTORY_DETAILED.map(h => {
      const income = sum(Object.values(h.income));
      const fixed = sum(Object.values(h.fixedByCategory));
      const variable = sum(Object.values(h.variableByCategory));
      return {
        month: h.month, label: h.label,
        income, expense: fixed + variable,
        fixed, variable,
        incomeBySrc: h.income,
        fixedByCategory: h.fixedByCategory,
        variableByCategory: h.variableByCategory,
        isCurrent: false,
      };
    });

    // Current month from live entries (use predicted amounts incl pending)
    const incomeBySrc = {};
    const fixedByCategory = {};
    const variableByCategory = {};
    for (const e of currentEntries) {
      const amt = e.paid !== null ? e.paid : e.amount;
      if (e.kind === 'income') {
        incomeBySrc[e.category] = (incomeBySrc[e.category] || 0) + amt;
      } else {
        if (e.type === 'fixo') fixedByCategory[e.category] = (fixedByCategory[e.category] || 0) + amt;
        else variableByCategory[e.category] = (variableByCategory[e.category] || 0) + amt;
      }
    }
    const income = sum(Object.values(incomeBySrc));
    const fixed = sum(Object.values(fixedByCategory));
    const variable = sum(Object.values(variableByCategory));
    const label = PPx.MONTH_NAMES_SHORT[parseInt(currentMonthKey.slice(5), 10) - 1];
    history.push({
      month: currentMonthKey, label: `${label.charAt(0).toUpperCase()}${label.slice(1)}`,
      income, expense: fixed + variable,
      fixed, variable,
      incomeBySrc, fixedByCategory, variableByCategory,
      isCurrent: true,
    });

    return history;
  }

  function sum(arr) { return arr.reduce((s, v) => s + v, 0); }

  // ============ Insights ============
  function computeInsights(data) {
    if (data.length < 2) return null;
    const avgIncome = data.reduce((s, d) => s + d.income, 0) / data.length;
    const avgExpense = data.reduce((s, d) => s + d.expense, 0) / data.length;
    const avgSavings = avgIncome - avgExpense;

    const balances = data.map(d => ({ ...d, balance: d.income - d.expense }));
    const best = balances.reduce((a, b) => a.balance > b.balance ? a : b);
    const worst = balances.reduce((a, b) => a.balance < b.balance ? a : b);

    // Trend: compare latest vs previous
    const last = data[data.length - 1];
    const prev = data[data.length - 2];
    const expenseDelta = last.expense - prev.expense;
    const expensePct = prev.expense > 0 ? (expenseDelta / prev.expense) * 100 : 0;

    // Biggest category jump
    const allCats = new Set();
    [last, prev].forEach(d => Object.keys({ ...d.fixedByCategory, ...d.variableByCategory }).forEach(k => allCats.add(k)));
    let biggestJump = null;
    for (const cat of allCats) {
      const lastTotal = (last.fixedByCategory[cat] || 0) + (last.variableByCategory[cat] || 0);
      const prevTotal = (prev.fixedByCategory[cat] || 0) + (prev.variableByCategory[cat] || 0);
      const delta = lastTotal - prevTotal;
      if (Math.abs(delta) < 30) continue;
      if (!biggestJump || Math.abs(delta) > Math.abs(biggestJump.delta)) {
        biggestJump = { cat, delta, prevTotal, lastTotal };
      }
    }

    // Savings rate
    const savingsRate = avgIncome > 0 ? (avgSavings / avgIncome) * 100 : 0;

    return { avgIncome, avgExpense, avgSavings, savingsRate, best, worst, expenseDelta, expensePct, biggestJump, lastLabel: last.label, prevLabel: prev.label };
  }

  function InsightsStrip({ insights }) {
    if (!insights) return null;
    return (
      <div className="insights">
        <InsightCard
          label="Média mensal de receita"
          value={PPx.formatBRL(insights.avgIncome)}
          tone="income"
        />
        <InsightCard
          label="Média mensal de gastos"
          value={PPx.formatBRL(insights.avgExpense)}
          tone="expense"
          sub={
            <span style={{
              color: insights.expenseDelta > 0 ? 'var(--expense-fg)' : 'var(--income-fg)',
            }}>
              {insights.expenseDelta > 0 ? '↑' : '↓'} {Math.abs(insights.expensePct).toFixed(0)}% vs. {insights.prevLabel}
            </span>
          }
        />
        <InsightCard
          label="Taxa de poupança média"
          value={`${insights.savingsRate.toFixed(0)}%`}
          tone={insights.savingsRate >= 15 ? 'income' : insights.savingsRate >= 0 ? 'neutral' : 'expense'}
          sub={<span>sobrou {PPx.formatBRL(insights.avgSavings)}/mês em média</span>}
        />
        <InsightCard
          label={insights.biggestJump ? `Maior variação: ${PPx.categoryById(insights.biggestJump.cat, 'expense').label}` : 'Maior categoria'}
          value={insights.biggestJump ?
            `${insights.biggestJump.delta > 0 ? '+' : ''}${PPx.formatBRL(insights.biggestJump.delta)}` :
            '—'}
          tone={insights.biggestJump && insights.biggestJump.delta > 0 ? 'expense' : 'income'}
          sub={insights.biggestJump && <span>{insights.prevLabel} → {insights.lastLabel}</span>}
        />
      </div>
    );
  }

  function InsightCard({ label, value, sub, tone }) {
    const colorMap = {
      income: 'var(--income-fg)',
      expense: 'var(--expense-fg)',
      neutral: 'var(--text)',
    };
    return (
      <div className="insight-card">
        <div className="insight-label">{label}</div>
        <div className="insight-value num" style={{ color: colorMap[tone] || 'var(--text)' }}>
          {value}
        </div>
        {sub && <div className="insight-sub">{sub}</div>}
      </div>
    );
  }

  // ============ Range tabs ============
  function RangeTab({ active, onClick, children }) {
    return (
      <button className={`range-tab ${active ? 'active' : ''}`} onClick={onClick}>
        {children}
      </button>
    );
  }

  // ============ Total Income vs Expense chart ============
  function TotalChart({ data }) {
    return (
      <div className="card chart-card">
        <div className="card-header">
          <div>
            <div className="card-title">Receitas × Gastos totais</div>
            <div className="card-subtitle">visão geral da sua saúde financeira</div>
          </div>
          <div className="history-legend">
            <div className="row"><span className="swatch" style={{ background: 'var(--income-fg-soft)' }}></span> Receitas</div>
            <div className="row"><span className="swatch" style={{ background: 'var(--expense-fg-soft)' }}></span> Gastos</div>
            <div className="row"><span className="swatch dotted"></span> Saldo</div>
          </div>
        </div>
        <LineChart
          height={220}
          data={data}
          series={[
            { key: 'income', label: 'Receitas', color: 'var(--income-fg-soft)', filled: true },
            { key: 'expense', label: 'Gastos', color: 'var(--expense-fg-soft)', filled: true },
            { key: 'balance', label: 'Saldo', color: 'var(--text)', dashed: true, derive: d => d.income - d.expense },
          ]}
        />
      </div>
    );
  }

  // ============ Fixed expenses by category ============
  function FixedExpensesChart({ data }) {
    const cats = useMemo(() => topCategories(data, 'fixedByCategory', 5), [data]);
    return (
      <div className="card chart-card">
        <div className="card-header">
          <div>
            <div className="card-title">Gastos fixos por categoria</div>
            <div className="card-subtitle">contas recorrentes — aluguel, plano de saúde, cartão…</div>
          </div>
        </div>
        <StackedAreaChart
          height={200}
          data={data}
          categories={cats}
          source="fixedByCategory"
        />
        <CategoryLegend cats={cats} data={data} source="fixedByCategory" />
      </div>
    );
  }

  // ============ Variable expenses by category ============
  function VariableExpensesChart({ data }) {
    const cats = useMemo(() => topCategories(data, 'variableByCategory', 5), [data]);
    return (
      <div className="card chart-card">
        <div className="card-header">
          <div>
            <div className="card-title">Gastos variáveis por categoria</div>
            <div className="card-subtitle">mercado, lazer, transporte — o que mais muda</div>
          </div>
        </div>
        <StackedAreaChart
          height={200}
          data={data}
          categories={cats}
          source="variableByCategory"
        />
        <CategoryLegend cats={cats} data={data} source="variableByCategory" />
      </div>
    );
  }

  // ============ Income breakdown ============
  function IncomeChart({ data }) {
    const sources = useMemo(() => topCategories(data, 'incomeBySrc', 4, 'income'), [data]);
    return (
      <div className="card chart-card">
        <div className="card-header">
          <div>
            <div className="card-title">Composição da renda</div>
            <div className="card-subtitle">salário, pensão e renda extra ao longo dos meses</div>
          </div>
        </div>
        <StackedBarChart
          height={180}
          data={data}
          categories={sources}
          source="incomeBySrc"
        />
        <CategoryLegend cats={sources} data={data} source="incomeBySrc" />
      </div>
    );
  }

  function topCategories(data, source, n, kind = 'expense') {
    const totals = {};
    for (const d of data) {
      for (const [k, v] of Object.entries(d[source] || {})) {
        totals[k] = (totals[k] || 0) + v;
      }
    }
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([id]) => PPx.categoryById(id, kind));
  }

  // ============ Savings table ============
  function SavingsTable({ data }) {
    return (
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Resumo mês a mês</div>
            <div className="card-subtitle">números cruzados em formato de tabela</div>
          </div>
        </div>
        <table className="evo-table">
          <thead>
            <tr>
              <th>Mês</th>
              <th className="num-col">Receita</th>
              <th className="num-col">Gastos fixos</th>
              <th className="num-col">Gastos variáveis</th>
              <th className="num-col">Total gastos</th>
              <th className="num-col">Saldo</th>
              <th className="num-col">Taxa poup.</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => {
              const balance = d.income - d.expense;
              const rate = d.income > 0 ? (balance / d.income) * 100 : 0;
              return (
                <tr key={d.month} className={d.isCurrent ? 'is-current' : ''}>
                  <td style={{ fontWeight: 500 }}>
                    {d.label}
                    {d.isCurrent && <span className="badge-current">mês atual</span>}
                  </td>
                  <td className="num-col num" style={{ color: 'var(--income-fg)' }}>{PPx.formatBRL(d.income)}</td>
                  <td className="num-col num">{PPx.formatBRL(d.fixed)}</td>
                  <td className="num-col num">{PPx.formatBRL(d.variable)}</td>
                  <td className="num-col num" style={{ color: 'var(--expense-fg)' }}>{PPx.formatBRL(d.expense)}</td>
                  <td className="num-col num" style={{ color: balance >= 0 ? 'var(--income-fg)' : 'var(--expense-fg)', fontWeight: 600 }}>
                    {PPx.formatBRL(balance)}
                  </td>
                  <td className="num-col num" style={{ color: rate >= 15 ? 'var(--income-fg)' : rate >= 0 ? 'var(--text-secondary)' : 'var(--expense-fg)' }}>
                    {rate.toFixed(0)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // ============ Generic Line Chart ============
  function LineChart({ data, series, height = 200 }) {
    const W = 800, H = height, P = { l: 52, r: 24, t: 16, b: 32 };
    const innerW = W - P.l - P.r;
    const innerH = H - P.t - P.b;

    const vals = (s) => data.map(d => (s.derive ? s.derive(d) : d[s.key]));
    const allVals = series.flatMap(s => vals(s));
    const min = Math.min(0, ...allVals);
    const max = Math.max(...allVals) * 1.1;
    const range = max - min || 1;

    const x = (i) => P.l + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = (v) => P.t + innerH - ((v - min) / range) * innerH;
    const y0 = y(0);

    return (
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const yy = P.t + innerH - t * innerH;
            return <line key={t} className="chart-grid" x1={P.l} x2={W - P.r} y1={yy} y2={yy} />;
          })}
          {[0, 0.5, 1].map(t => {
            const v = min + t * range;
            const yy = P.t + innerH - t * innerH;
            return <text key={t} className="chart-axis-label" x={P.l - 8} y={yy + 3} textAnchor="end">{PPx.formatBRLcompact(v).replace('R$ ', '')}</text>;
          })}
          {/* Filled areas for income/expense (subtle) */}
          {series.filter(s => s.filled).map(s => {
            const v = vals(s);
            const pts = v.map((vv, i) => `${x(i)},${y(vv)}`).join(' ');
            const area = `M ${x(0)},${y0} L ${v.map((vv, i) => `${x(i)},${y(vv)}`).join(' L ')} L ${x(v.length - 1)},${y0} Z`;
            return (
              <g key={s.key}>
                <path d={area} fill={s.color} opacity="0.08" />
              </g>
            );
          })}
          {/* Lines */}
          {series.map(s => {
            const v = vals(s);
            const d = v.map((vv, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(vv)}`).join(' ');
            return (
              <path key={s.key}
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? '4 4' : 'none'}
                opacity={s.dashed ? 0.6 : 1}
              />
            );
          })}
          {/* Dots */}
          {series.map(s => {
            if (s.dashed) return null;
            const v = vals(s);
            return v.map((vv, i) => (
              <circle key={`${s.key}-${i}`}
                cx={x(i)} cy={y(vv)} r={3.5}
                fill="var(--bg)" stroke={s.color} strokeWidth={1.75}
              />
            ));
          })}
          {/* x labels */}
          {data.map((d, i) => (
            <text key={i}
              x={x(i)} y={H - 10}
              textAnchor="middle"
              className={`chart-axis-label ${d.isCurrent ? 'is-current' : ''}`}
            >{d.label}</text>
          ))}
        </svg>
      </div>
    );
  }

  // ============ Stacked Area Chart ============
  function StackedAreaChart({ data, categories, source, height = 180 }) {
    const W = 800, H = height, P = { l: 52, r: 16, t: 10, b: 28 };
    const innerW = W - P.l - P.r;
    const innerH = H - P.t - P.b;

    // Build stacks per data point
    const stacks = data.map(d => {
      let acc = 0;
      const out = {};
      let total = 0;
      for (const cat of categories) {
        const v = (d[source] || {})[cat.id] || 0;
        out[cat.id] = { bottom: acc, top: acc + v };
        acc += v;
        total += v;
      }
      out._total = acc;
      return out;
    });

    const maxTotal = Math.max(...stacks.map(s => s._total)) * 1.1 || 1;
    const x = (i) => P.l + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = (v) => P.t + innerH - (v / maxTotal) * innerH;

    return (
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {[0, 0.5, 1].map(t => {
            const yy = P.t + innerH - t * innerH;
            return <g key={t}>
              <line className="chart-grid" x1={P.l} x2={W - P.r} y1={yy} y2={yy} />
              <text className="chart-axis-label" x={P.l - 8} y={yy + 3} textAnchor="end">
                {PPx.formatBRLcompact(maxTotal * t).replace('R$ ', '')}
              </text>
            </g>;
          })}
          {/* Stack areas */}
          {categories.map((cat) => {
            const topPath = stacks.map((s, i) => `${x(i)},${y(s[cat.id].top)}`).join(' L ');
            const botPath = stacks.map((s, i) => `${x(i)},${y(s[cat.id].bottom)}`).reverse().join(' L ');
            return (
              <path key={cat.id}
                d={`M ${topPath} L ${botPath} Z`}
                fill={cat.color}
                opacity={0.75}
                stroke="var(--bg)"
                strokeWidth={0.5}
              />
            );
          })}
          {/* x labels */}
          {data.map((d, i) => (
            <text key={i}
              x={x(i)} y={H - 8}
              textAnchor="middle"
              className={`chart-axis-label ${d.isCurrent ? 'is-current' : ''}`}
            >{d.label}</text>
          ))}
        </svg>
      </div>
    );
  }

  // ============ Stacked Bar Chart ============
  function StackedBarChart({ data, categories, source, height = 180 }) {
    const W = 800, H = height, P = { l: 52, r: 16, t: 10, b: 28 };
    const innerW = W - P.l - P.r;
    const innerH = H - P.t - P.b;

    const totals = data.map(d => categories.reduce((s, c) => s + ((d[source] || {})[c.id] || 0), 0));
    const max = Math.max(...totals) * 1.1 || 1;
    const barW = Math.min(48, (innerW / data.length) * 0.55);

    const x = (i) => P.l + (i / Math.max(data.length - 1, 1)) * innerW;
    const y = (v) => P.t + innerH - (v / max) * innerH;

    return (
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          {[0, 0.5, 1].map(t => {
            const yy = P.t + innerH - t * innerH;
            return <g key={t}>
              <line className="chart-grid" x1={P.l} x2={W - P.r} y1={yy} y2={yy} />
              <text className="chart-axis-label" x={P.l - 8} y={yy + 3} textAnchor="end">
                {PPx.formatBRLcompact(max * t).replace('R$ ', '')}
              </text>
            </g>;
          })}
          {data.map((d, i) => {
            let acc = 0;
            const cx = x(i);
            return (
              <g key={i}>
                {categories.map(cat => {
                  const v = (d[source] || {})[cat.id] || 0;
                  if (v === 0) return null;
                  const top = y(acc + v);
                  const bot = y(acc);
                  acc += v;
                  return (
                    <rect key={cat.id}
                      x={cx - barW / 2}
                      y={top}
                      width={barW}
                      height={Math.max(bot - top, 0.5)}
                      fill={cat.color}
                      opacity={d.isCurrent ? 1 : 0.85}
                    />
                  );
                })}
              </g>
            );
          })}
          {data.map((d, i) => (
            <text key={i}
              x={x(i)} y={H - 8}
              textAnchor="middle"
              className={`chart-axis-label ${d.isCurrent ? 'is-current' : ''}`}
            >{d.label}</text>
          ))}
        </svg>
      </div>
    );
  }

  // ============ Legend ============
  function CategoryLegend({ cats, data, source }) {
    const totals = {};
    for (const d of data) {
      for (const [k, v] of Object.entries(d[source] || {})) {
        totals[k] = (totals[k] || 0) + v;
      }
    }
    return (
      <div className="cat-legend">
        {cats.map(c => (
          <div key={c.id} className="cat-legend-item">
            <span className="dot" style={{ background: c.color }}></span>
            <span className="name">{c.label}</span>
            <span className="val num">{PPx.formatBRL(totals[c.id] || 0)}</span>
          </div>
        ))}
      </div>
    );
  }

  window.Evolution = Evolution;
})();
