'use client'

import { useState, useEffect, useCallback } from 'react'
import { monthKey, shiftMonth } from '@/lib/formatters'

export function useMonthNav(initial?: string) {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(initial ?? monthKey(today))

  const prev = useCallback(() => setCurrentMonth(k => shiftMonth(k, -1)), [])
  const next = useCallback(() => setCurrentMonth(k => shiftMonth(k, 1)), [])
  const goToday = useCallback(() => setCurrentMonth(monthKey(today)), [])

  const isToday = currentMonth === monthKey(today)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 't' || e.key === 'T') goToday()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, goToday])

  return { currentMonth, setCurrentMonth, prev, next, goToday, isToday, today }
}
