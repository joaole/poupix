'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { CategoryRepository } from '@/repositories/CategoryRepository'
import { CategoryService } from '@/services/CategoryService'
import { slugify } from '@/lib/formatters'
import type { Category, TransactionType } from '@/domain/types'

function getService() {
  return new CategoryService(new CategoryRepository(createClient()))
}

export function useCategories(userId: string | undefined) {
  return useQuery<Category[]>({
    queryKey: ['categories', userId],
    queryFn: async () => {
      if (!userId) return []
      const result = await getService().getCategories(userId)
      if (result.error) throw result.error
      return result.data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  })
}

export interface CreateCategoryInput {
  name: string
  type: TransactionType
  color: string
}

export function useCreateCategory(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      const result = await getService().createCategory({
        userId,
        name: input.name,
        type: input.type,
        color: input.color,
        slug: slugify(input.name),
      })
      if (result.error) throw result.error
      return result.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', userId] }),
  })
}
