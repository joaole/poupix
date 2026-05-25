import type { ITransactionRepository } from '@/domain/interfaces/ITransactionRepository'
import type { ICategoryRepository } from '@/domain/interfaces/ICategoryRepository'
import type { Transaction, TransactionVM, Category, MonthlySummary, Result } from '@/domain/types'
import { statusOf } from '@/lib/utils'
import { z } from 'zod'

// Validation schemas
export const CreateTransactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(1, 'Descrição obrigatória').max(200),
  categoryId: z.string().uuid('Categoria inválida'),
  isFixed: z.boolean().default(false),
  scheduledDate: z.coerce.date(),
  referenceMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Formato inválido'),
  predictedAmount: z.number().min(0),
  notes: z.string().max(500).default(''),
})

export const BaixaSchema = z.object({
  paidAmount: z.number().min(0),
  paidAt: z.coerce.date(),
  notes: z.string().max(500).default(''),
  attachmentUrl: z.string().nullable().optional(),
})

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>
export type BaixaInput = z.infer<typeof BaixaSchema>

export class TransactionService {
  constructor(
    private readonly txRepo: ITransactionRepository,
    private readonly catRepo: ICategoryRepository,
  ) {}

  async getMonthTransactions(userId: string, month: string, today: Date): Promise<Result<TransactionVM[]>> {
    // Ensure fixed transactions are populated for this month
    const txResult = await this.txRepo.ensureMonthPopulated(userId, month)
    if (txResult.error) return { data: null, error: txResult.error }

    const catResult = await this.catRepo.findByUserId(userId)
    if (catResult.error) return { data: null, error: catResult.error }

    const catMap = new Map(catResult.data.map(c => [c.id, c]))
    const fallbackCat: Category = { id: '', userId, name: 'Outros', type: 'expense', color: '#888', slug: 'outros', createdAt: new Date() }

    const vms: TransactionVM[] = txResult.data.map(t => ({
      ...t,
      category: catMap.get(t.categoryId) ?? fallbackCat,
      status: statusOf(t, today),
    }))

    return { data: vms, error: null }
  }

  async getTransactionsForRange(userId: string, fromMonth: string, toMonth: string): Promise<Result<Transaction[]>> {
    return this.txRepo.findByDateRange(userId, fromMonth, toMonth)
  }

  async createTransaction(userId: string, input: CreateTransactionInput): Promise<Result<Transaction>> {
    const parsed = CreateTransactionSchema.safeParse(input)
    if (!parsed.success) {
      return { data: null, error: new Error(parsed.error.errors[0].message) }
    }
    return this.txRepo.create({
      userId,
      type: parsed.data.type,
      description: parsed.data.description,
      categoryId: parsed.data.categoryId,
      isFixed: parsed.data.isFixed,
      fixedTemplateId: null,
      referenceMonth: parsed.data.referenceMonth,
      scheduledDate: parsed.data.scheduledDate,
      predictedAmount: parsed.data.predictedAmount,
      paidAmount: null,
      paidAt: null,
      notes: parsed.data.notes,
      attachmentUrl: null,
    })
  }

  async updateTransaction(id: string, userId: string, patch: Partial<Transaction>): Promise<Result<Transaction>> {
    return this.txRepo.update(id, userId, patch)
  }

  async baixa(id: string, userId: string, input: BaixaInput): Promise<Result<Transaction>> {
    const parsed = BaixaSchema.safeParse(input)
    if (!parsed.success) {
      return { data: null, error: new Error(parsed.error.errors[0].message) }
    }
    return this.txRepo.update(id, userId, {
      paidAmount: parsed.data.paidAmount,
      paidAt: parsed.data.paidAt,
      notes: parsed.data.notes,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
    })
  }

  async undoBaixa(id: string, userId: string): Promise<Result<Transaction>> {
    return this.txRepo.update(id, userId, {
      paidAmount: null,
      paidAt: null,
    })
  }

  async deleteTransaction(id: string, userId: string): Promise<Result<void>> {
    return this.txRepo.delete(id, userId)
  }

  computeSummary(transactions: TransactionVM[]): MonthlySummary {
    let incomeConfirmed = 0, expenseConfirmed = 0
    let incomePending = 0, expensePending = 0
    let incomeTotal = 0, expenseTotal = 0
    let overdueCount = 0

    for (const t of transactions) {
      if (t.type === 'income') incomeTotal += t.predictedAmount
      else expenseTotal += t.predictedAmount

      if (t.status === 'paid') {
        if (t.type === 'income') incomeConfirmed += t.paidAmount!
        else expenseConfirmed += t.paidAmount!
      } else {
        if (t.type === 'income') incomePending += t.predictedAmount
        else expensePending += t.predictedAmount
        if (t.status === 'overdue') overdueCount++
      }
    }

    return {
      incomeConfirmed,
      expenseConfirmed,
      incomePending,
      expensePending,
      incomeTotal,
      expenseTotal,
      balanceConfirmed: incomeConfirmed - expenseConfirmed,
      balanceProjected: incomeTotal - expenseTotal,
      overdueCount,
    }
  }
}
