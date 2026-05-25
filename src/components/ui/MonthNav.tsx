'use client'

import { Icon } from './Icon'
import { monthLabel } from '@/lib/formatters'

interface Props {
  currentMonth: string
  isToday: boolean
  onPrev: () => void
  onNext: () => void
  onGoToday: () => void
}

export function MonthNav({ currentMonth, isToday, onPrev, onNext, onGoToday }: Props) {
  return (
    <div className="month-nav">
      <button onClick={onPrev} title="Mês anterior (←)">
        <Icon name="chevronLeft" size={14} />
      </button>
      <div className="month-label">{monthLabel(currentMonth)}</div>
      <button onClick={onNext} title="Próximo mês (→)">
        <Icon name="chevronRight" size={14} />
      </button>
      {!isToday && (
        <button className="today-btn" onClick={onGoToday} title="Voltar para mês atual (T)">
          hoje
        </button>
      )}
    </div>
  )
}
