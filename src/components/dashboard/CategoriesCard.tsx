import { formatBRL } from '@/lib/formatters'

interface CategoryStat {
  id: string
  name: string
  color: string
  value: number
}

export function CategoriesCard({ stats }: { stats: { categories: CategoryStat[] } }) {
  const total = stats.categories.reduce((s, c) => s + c.value, 0)
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
            const pct = total > 0 ? (c.value / total) * 100 : 0
            return (
              <div className="cat-row" key={c.id}>
                <div className="top">
                  <div className="name">
                    <span className="dot" style={{ background: c.color }} />
                    {c.name}
                  </div>
                  <div>
                    <span className="val">{formatBRL(c.value)}</span>
                    <span className="pct" style={{ marginLeft: 8 }}>{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="bar">
                  <i style={{ width: `${pct}%`, background: c.color }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
