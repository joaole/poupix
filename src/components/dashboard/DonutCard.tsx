import { formatBRLCompact } from '@/lib/formatters'

interface CategoryStat { id: string; name: string; color: string; value: number }

export function DonutCard({ stats }: { stats: { categories: CategoryStat[] } }) {
  const total = stats.categories.reduce((s, c) => s + c.value, 0)
  const R = 52, STROKE = 16, CX = 66, CY = 66
  const C = 2 * Math.PI * R

  let offset = 0
  const segments = stats.categories.slice(0, 6).map(c => {
    const pct = total > 0 ? c.value / total : 0
    const len = C * pct
    const seg = { ...c, dasharray: `${len} ${C - len}`, dashoffset: -offset }
    offset += len
    return seg
  })

  const rest = stats.categories.slice(6)
  if (rest.length) {
    const sum = rest.reduce((s, c) => s + c.value, 0)
    const len = C * (total > 0 ? sum / total : 0)
    segments.push({
      id: '_rest', name: `+${rest.length} outras`, color: 'var(--text-tertiary)', value: sum,
      dasharray: `${len} ${C - len}`, dashoffset: -offset,
    })
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
                <circle
                  key={s.id} cx={CX} cy={CY} r={R}
                  fill="none" stroke={s.color} strokeWidth={STROKE}
                  strokeDasharray={s.dasharray}
                  strokeDashoffset={s.dashoffset}
                />
              ))}
            </svg>
            <div className="donut-center">
              <div className="total">{formatBRLCompact(total)}</div>
              <div className="lbl">total</div>
            </div>
          </div>
          <div className="donut-legend">
            {segments.slice(0, 5).map(s => {
              const pct = total > 0 ? (s.value / total) * 100 : 0
              return (
                <div className="row" key={s.id}>
                  <span className="swatch" style={{ background: s.color }} />
                  <span className="nm">{s.name}</span>
                  <span className="vl">{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
