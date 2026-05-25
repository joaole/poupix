'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { TransactionRepository } from '@/repositories/TransactionRepository'
import { CategoryRepository } from '@/repositories/CategoryRepository'
import { EvolutionService } from '@/services/EvolutionService'
import { shiftMonth } from '@/lib/formatters'
import type { MonthDataPoint } from '@/domain/types'

export function useEvolution(userId: string | undefined, currentMonth: string) {
  return useQuery<MonthDataPoint[]>({
    queryKey: ['evolution', userId, currentMonth],
    queryFn: async () => {
      if (!userId) return []
      const supabase = createClient()
      const txRepo = new TransactionRepository(supabase)
      const catRepo = new CategoryRepository(supabase)

      // Fetch 12 months of history ending at current month
      const fromMonth = shiftMonth(currentMonth, -11)

      const [txResult, catResult] = await Promise.all([
        txRepo.findByDateRange(userId, fromMonth, currentMonth),
        catRepo.findByUserId(userId),
      ])

      if (txResult.error) throw txResult.error
      if (catResult.error) throw catResult.error

      const service = new EvolutionService()
      return service.buildMonthDataPoints(txResult.data, catResult.data, currentMonth)
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  })
}
