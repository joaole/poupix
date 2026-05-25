'use client'

import { useState, useEffect } from 'react'
import { formatAmountForInput, parseAmountInput } from '@/lib/formatters'

interface Props {
  value: number
  onCommit: (v: number) => void
  color?: string
}

export function AmountCell({ value, onCommit, color }: Props) {
  const [draft, setDraft] = useState(formatAmountForInput(value))
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!editing) setDraft(formatAmountForInput(value))
  }, [value, editing])

  function commit() {
    const n = parseAmountInput(draft)
    onCommit(n)
    setDraft(formatAmountForInput(n))
    setEditing(false)
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
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') {
          setDraft(formatAmountForInput(value))
          setEditing(false)
          e.currentTarget.blur()
        }
      }}
    />
  )
}
