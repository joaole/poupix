'use client'

import { useMemo, useState } from 'react'
import type { MonthDataPoint, Category } from '@/domain/types'
import { EvolutionService } from '@/services/EvolutionService'
import { LineChart, StackedAreaChart, StackedBarChart } from './charts'
import { formatBRL } from '@/lib/formatters'

interface Props {
  data: MonthDataPoint[]
  categories: Category[]
  masked: boolean
}

export function Evolution({ data, categories, masked }: Props) {
  const [range, setRange] = useState<'3m' | '6m' | 'all'>('all')
  const service = useMemo(() => new EvolutionService(), [])

  const filtered = useMemo(() => {
    if (range === 'all') return data
    const n = range === '3m' ? 3 : 6
    return data.slice(-n)
  }, [data, range])

  const insights = useMemo(() => service.computeInsights(filtered), [service, filtered])

  const catMap = useMemo(() => new Map(categories.map(c => [c.slug, c])), [categories])

  function topCats(source: 'fixedByCategory' | 'variableByCategory' | 'incomeBySrc', n: number) {
    return service.topCategories(filtered, source, n).map(slug => catMap.get(slug)).filter(Boolean) as Category[]
  }

  const fixedCats    = useMemo(() => topCats('fixedByCategory', 5), [filtered, categories])
  const variableCats = useMemo(() => topCats('variableByCategory', 5), [filtered, categories])
  const incomeCats   = useMemo(() => topCats('incomeBySrc', 4), [filtered, categories])

  return (
    <div className={`evolution ${masked ? 'masked' : ''}`}>
      <header className="view-header">
        <div>
          <p className="view-subtitle">Como sua vida financeira se comportou nos últimos meses</p>
        </div>
        <div className="range-tabs">
          {(['3m', '6m', 'all'] as const).map(r => (
            <button
              key={r}
              className={`range-tab ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r === 'all' ? 'tudo' : r}
            </button>
          ))}
        </div>
      </header>

      {insights && (
        <div className="insights">
          <InsightCard
            label="Média mensal de receita"
            value={formatBRL(insights.avgIncome)}
            tone="income"
          />
          <InsightCard
            label="Média mensal de gastos"
            value={formatBRL(insights.avgExpense)}
            tone="expense"
            sub={
              <span style={{ color: insights.expenseDelta > 0 ? 'var(--expense-fg)' : 'var(--income-fg)' }}>
                {insights.expenseDelta > 0 ? '↑' : '↓'} {Math.abs(insights.expensePct).toFixed(0)}% vs. {insights.prevLabel}
              </span>
            }
          />
          <InsightCard
            label="Taxa de poupança média"
            value={`${insights.savingsRate.toFixed(0)}%`}
            tone={insights.savingsRate >= 15 ? 'income' : insights.savingsRate >= 0 ? 'neutral' : 'expense'}
            sub={<span>sobrou {formatBRL(insights.avgSavings)}/mês em média</span>}
          />
          <InsightCard
            label={insights.biggestJump
              ? `Maior variação: ${catMap.get(insights.biggestJump.cat)?.name ?? insights.biggestJump.cat}`
              : 'Maior categoria'}
            value={insights.biggestJump
              ? `${insights.biggestJump.delta > 0 ? '+' : ''}${formatBRL(insights.biggestJump.delta)}`
              : '—'}
            tone={insights.biggestJump && insights.biggestJump.delta > 0 ? 'expense' : 'income'}
            sub={insights.biggestJump && <span>{insights.prevLabel} → {insights.lastLabel}</span>}
          />
        </div>
      )}

      <div className="card chart-card">
        <div className="card-header">
          <div>
            <div className="card-title">Receitas × Gastos totais</div>
            <div className="card-subtitle">visão geral da sua saúde financeira</div>
          </div>
          <div className="history-legend">
            <div className="row"><span className="swatch" style={{ background: 'var(--income-fg-soft)' }} /> Receitas</div>
            <div className="row"><span className="swatch" style={{ background: 'var(--expense-fg-soft)' }} /> Gastos</div>
            <div className="row"><span className="swatch dotted" /> Saldo</div>
          </div>
        </div>
        <LineChart
          height={220}
          data={filtered}
          series={[
            { key: 'income',  color: 'var(--income-fg-soft)',  filled: true },
            { key: 'expense', color: 'var(--expense-fg-soft)', filled: true },
            { key: 'balance', color: 'var(--text)',            dashed: true, derive: d => d.income - d.expense },
          ]}
        />
      </div>

      <div className="evo-grid-2">
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Gastos fixos por categoria</div>
              <div className="card-subtitle">contas recorrentes</div>
            </div>
          </div>
          <StackedAreaChart height={200} data={filtered} categories={fixedCats} source="fixedByCategory" />
          <CategoryLegend cats={fixedCats} data={filtered} source="fixedByCategory" />
        </div>
        <div className="card chart-card">
          <div className="card-header">
            <div>
              <div className="card-title">Gastos variáveis por categoria</div>
              <div className="card-subtitle">mercado, lazer, transporte</div>
            </div>
          </div>
          <StackedAreaChart height={200} data={filtered} categories={variableCats} source="variableByCategory" />
          <CategoryLegend cats={variableCats} data={filtered} source="variableByCategory" />
        </div>
      </div>

      <div className="card chart-card">
        <div className="card-header">
          <div>
            <div className="card-title">Composição da renda</div>
            <div className="card-subtitle">salário, pensão e renda extra ao longo dos meses</div>
          </div>
        </div>
        <StackedBarChart height={180} data={filtered} categories={incomeCats} source="incomeBySrc" />
        <CategoryLegend cats={incomeCats} data={filtered} source="incomeBySrc" />
      </div>

      <SavingsTable data={filtered} />
    </div>
  )
}

function InsightCard({ label, value, sub, tone }: {
  label: string; value: string
  sub?: React.ReactNode; tone?: string
}) {
  const colorMap: Record<string, string> = {
    income: 'var(--income-fg)',
    expense: 'var(--expense-fg)',
    neutral: 'var(--text)',
  }
  return (
    <div className="insight-card">
      <div className="insight-label">{label}</div>
      <div className="insight-value num" style={{ color: colorMap[tone ?? ''] ?? 'var(--text)' }}>
        {value}
      </div>
      {sub && <div className="insight-sub">{sub}</div>}
    </div>
  )
}

function CategoryLegend({
  cats, data, source,
}: {
  cats: Category[]
  data: MonthDataPoint[]
  source: 'fixedByCategory' | 'variableByCategory' | 'incomeBySrc'
}) {
  const totals: Record<string, number> = {}
  for (const d of data) {
    for (const [k, v] of Object.entries(d[source] ?? {})) {
      totals[k] = (totals[k] ?? 0) + v
    }
  }
  return (
    <div className="cat-legend">
      {cats.map(c => (
        <div key={c.id} className="cat-legend-item">
          <span className="dot" style={{ background: c.color }} />
          <span className="name">{c.name}</span>
          <span className="val num">{formatBRL(totals[c.slug] ?? 0)}</span>
        </div>
      ))}
    </div>
  )
}

function SavingsTable({ data }: { data: MonthDataPoint[] }) {
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
            const balance = d.income - d.expense
            const rate = d.income > 0 ? (balance / d.income) * 100 : 0
            return (
              <tr key={d.month} className={d.isCurrent ? 'is-current' : ''}>
                <td style={{ fontWeight: 500 }}>
                  {d.label}
                  {d.isCurrent && <span className="badge-current">mês atual</span>}
                </td>
                <td className="num-col num" style={{ color: 'var(--income-fg)' }}>{formatBRL(d.income)}</td>
                <td className="num-col num">{formatBRL(d.fixed)}</td>
                <td className="num-col num">{formatBRL(d.variable)}</td>
                <td className="num-col num" style={{ color: 'var(--expense-fg)' }}>{formatBRL(d.expense)}</td>
                <td className="num-col num" style={{ color: balance >= 0 ? 'var(--income-fg)' : 'var(--expense-fg)', fontWeight: 600 }}>
                  {formatBRL(balance)}
                </td>
                <td className="num-col num" style={{ color: rate >= 15 ? 'var(--income-fg)' : rate >= 0 ? 'var(--text-secondary)' : 'var(--expense-fg)' }}>
                  {rate.toFixed(0)}%
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
