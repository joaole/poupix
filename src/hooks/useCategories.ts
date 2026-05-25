'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { CategoryRepository } from '@/repositories/CategoryRepository'
import { CategoryService } from '@/services/CategoryService'
import type { Category } from '@/domain/types'

export function useCategories(userId: string | undefined) {
  return useQuery<Category[]>({
    queryKey: ['categories', userId],
    queryFn: async () => {
      if (!userId) return []
      const supabase = createClient()
      const repo = new CategoryRepository(supabase)
      const service = new CategoryService(repo)
      const result = await service.getCategories(userId)
      if (result.error) throw result.error
      return result.data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}
