'use client'

import { formatBRLCompact } from '@/lib/formatters'
import type { MonthDataPoint } from '@/domain/types'

// ===================== Line Chart =====================

interface LineSeries {
  key: string
  color: string
  dashed?: boolean
  filled?: boolean
  derive?: (d: MonthDataPoint) => number
}

export function LineChart({
  data, series, height = 200,
}: {
  data: MonthDataPoint[]
  series: LineSeries[]
  height?: number
}) {
  const W = 800, H = height, P = { l: 52, r: 24, t: 16, b: 32 }
  const innerW = W - P.l - P.r
  const innerH = H - P.t - P.b

  const vals = (s: LineSeries) => data.map(d => s.derive ? s.derive(d) : (d as unknown as Record<string, number>)[s.key] ?? 0)
  const allVals = series.flatMap(s => vals(s))
  const min = Math.min(0, ...allVals)
  const max = Math.max(...allVals) * 1.1 || 1
  const range = max - min || 1

  const x = (i: number) => P.l + (i / Math.max(data.length - 1, 1)) * innerW
  const y = (v: number) => P.t + innerH - ((v - min) / range) * innerH
  const y0 = y(0)

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const yy = P.t + innerH - t * innerH
          return <line key={t} className="chart-grid" x1={P.l} x2={W - P.r} y1={yy} y2={yy} />
        })}
        {[0, 0.5, 1].map(t => {
          const v = min + t * range
          const yy = P.t + innerH - t * innerH
          return (
            <text key={t} className="chart-axis-label" x={P.l - 8} y={yy + 3} textAnchor="end">
              {formatBRLCompact(v).replace('R$ ', '')}
            </text>
          )
        })}
        {series.filter(s => s.filled).map(s => {
          const v = vals(s)
          const area = `M ${x(0)},${y0} L ${v.map((vv, i) => `${x(i)},${y(vv)}`).join(' L ')} L ${x(v.length - 1)},${y0} Z`
          return <path key={s.key} d={area} fill={s.color} opacity="0.08" />
        })}
        {series.map(s => {
          const v = vals(s)
          const d = v.map((vv, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(vv)}`).join(' ')
          return (
            <path
              key={s.key} d={d} fill="none" stroke={s.color} strokeWidth={2}
              strokeDasharray={s.dashed ? '4 4' : 'none'}
              opacity={s.dashed ? 0.6 : 1}
            />
          )
        })}
        {series.map(s => {
          if (s.dashed) return null
          return vals(s).map((vv, i) => (
            <circle key={`${s.key}-${i}`} cx={x(i)} cy={y(vv)} r={3.5}
              fill="var(--bg)" stroke={s.color} strokeWidth={1.75} />
          ))
        })}
        {data.map((d, i) => (
          <text
            key={i} x={x(i)} y={H - 10} textAnchor="middle"
            className={`chart-axis-label ${d.isCurrent ? 'is-current' : ''}`}
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ===================== Stacked Area Chart =====================

export function StackedAreaChart({
  data, categories, source, height = 180,
}: {
  data: MonthDataPoint[]
  categories: { id: string; slug: string; color: string }[]
  source: 'fixedByCategory' | 'variableByCategory'
  height?: number
}) {
  const W = 800, H = height, P = { l: 52, r: 16, t: 10, b: 28 }
  const innerW = W - P.l - P.r
  const innerH = H - P.t - P.b

  type StackEntry = Record<string, { bottom: number; top: number }> & { _total: number }
  const stacks: StackEntry[] = data.map(d => {
    let acc = 0
    const out: Record<string, { bottom: number; top: number }> = {}
    for (const cat of categories) {
      const v = (d[source] ?? {})[cat.slug] ?? 0
      out[cat.slug] = { bottom: acc, top: acc + v }
      acc += v
    }
    return { ...out, _total: acc } as StackEntry
  })

  const maxTotal = Math.max(...stacks.map(s => s._total as number)) * 1.1 || 1
  const x = (i: number) => P.l + (i / Math.max(data.length - 1, 1)) * innerW
  const y = (v: number) => P.t + innerH - (v / maxTotal) * innerH

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0, 0.5, 1].map(t => {
          const yy = P.t + innerH - t * innerH
          return (
            <g key={t}>
              <line className="chart-grid" x1={P.l} x2={W - P.r} y1={yy} y2={yy} />
              <text className="chart-axis-label" x={P.l - 8} y={yy + 3} textAnchor="end">
                {formatBRLCompact(maxTotal * t).replace('R$ ', '')}
              </text>
            </g>
          )
        })}
        {categories.map(cat => {
          const topPath = stacks.map((s, i) => `${x(i)},${y((s[cat.slug] as { top: number }).top)}`).join(' L ')
          const botPath = stacks.map((s, i) => `${x(i)},${y((s[cat.slug] as { bottom: number }).bottom)}`).reverse().join(' L ')
          return (
            <path
              key={cat.id}
              d={`M ${topPath} L ${botPath} Z`}
              fill={cat.color} opacity={0.75}
              stroke="var(--bg)" strokeWidth={0.5}
            />
          )
        })}
        {data.map((d, i) => (
          <text
            key={i} x={x(i)} y={H - 8} textAnchor="middle"
            className={`chart-axis-label ${d.isCurrent ? 'is-current' : ''}`}
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ===================== Stacked Bar Chart =====================

export function StackedBarChart({
  data, categories, source, height = 180,
}: {
  data: MonthDataPoint[]
  categories: { id: string; slug: string; color: string }[]
  source: 'incomeBySrc'
  height?: number
}) {
  const W = 800, H = height, P = { l: 52, r: 16, t: 10, b: 28 }
  const innerW = W - P.l - P.r
  const innerH = H - P.t - P.b

  const totals = data.map(d => categories.reduce((s, c) => s + ((d[source] ?? {})[c.slug] ?? 0), 0))
  const max = Math.max(...totals) * 1.1 || 1
  const barW = Math.min(48, (innerW / data.length) * 0.55)

  const x = (i: number) => P.l + (i / Math.max(data.length - 1, 1)) * innerW
  const y = (v: number) => P.t + innerH - (v / max) * innerH

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0, 0.5, 1].map(t => {
          const yy = P.t + innerH - t * innerH
          return (
            <g key={t}>
              <line className="chart-grid" x1={P.l} x2={W - P.r} y1={yy} y2={yy} />
              <text className="chart-axis-label" x={P.l - 8} y={yy + 3} textAnchor="end">
                {formatBRLCompact(max * t).replace('R$ ', '')}
              </text>
            </g>
          )
        })}
        {data.map((d, i) => {
          let acc = 0
          const cx = x(i)
          return (
            <g key={i}>
              {categories.map(cat => {
                const v = (d[source] ?? {})[cat.slug] ?? 0
                if (v === 0) return null
                const top = y(acc + v)
                const bot = y(acc)
                acc += v
                return (
                  <rect
                    key={cat.id}
                    x={cx - barW / 2} y={top}
                    width={barW} height={Math.max(bot - top, 0.5)}
                    fill={cat.color} opacity={d.isCurrent ? 1 : 0.85}
                  />
                )
              })}
            </g>
          )
        })}
        {data.map((d, i) => (
          <text
            key={i} x={x(i)} y={H - 8} textAnchor="middle"
            className={`chart-axis-label ${d.isCurrent ? 'is-current' : ''}`}
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  )
}
