'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { TransactionRepository } from '@/repositories/TransactionRepository'
import { CategoryRepository } from '@/repositories/CategoryRepository'
import { TransactionService, type BaixaInput, type CreateTransactionInput } from '@/services/TransactionService'
import type { TransactionVM, Transaction } from '@/domain/types'

function getService() {
  const supabase = createClient()
  return new TransactionService(
    new TransactionRepository(supabase),
    new CategoryRepository(supabase),
  )
}

export function useTransactions(userId: string | undefined, month: string, today: Date) {
  return useQuery<TransactionVM[]>({
    queryKey: ['transactions', userId, month],
    queryFn: async () => {
      if (!userId) return []
      const service = getService()
      const result = await service.getMonthTransactions(userId, month, today)
      if (result.error) throw result.error
      return result.data
    },
    enabled: !!userId,
  })
}

export function useCreateTransaction(userId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTransactionInput) => {
      const service = getService()
      return service.createTransaction(userId, input).then(r => {
        if (r.error) throw r.error
        return r.data
      })
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['transactions', userId, vars.referenceMonth] })
    },
  })
}

export function useUpdateTransaction(userId: string, month: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Transaction> }) => {
      const supabase = createClient()
      const repo = new TransactionRepository(supabase)
      return repo.update(id, userId, patch).then(r => {
        if (r.error) throw r.error
        return r.data
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', userId, month] })
    },
  })
}

export function useBaixa(userId: string, month: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BaixaInput }) => {
      const service = getService()
      return service.baixa(id, userId, input).then(r => {
        if (r.error) throw r.error
        return r.data
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', userId, month] })
    },
  })
}

export function useUndoBaixa(userId: string, month: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {
      const service = getService()
      return service.undoBaixa(id, userId).then(r => {
        if (r.error) throw r.error
        return r.data
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', userId, month] })
    },
  })
}

export function useDeleteTransaction(userId: string, month: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => {
      const supabase = createClient()
      const repo = new TransactionRepository(supabase)
      return repo.delete(id, userId).then(r => {
        if (r.error) throw r.error
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions', userId, month] })
    },
  })
}
