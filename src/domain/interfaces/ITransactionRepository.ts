import type { Transaction, FixedTemplate, Result } from '../types'

export interface ITransactionRepository {
  findByMonth(userId: string, month: string): Promise<Result<Transaction[]>>
  findByDateRange(userId: string, fromMonth: string, toMonth: string): Promise<Result<Transaction[]>>
  findById(id: string, userId: string): Promise<Result<Transaction>>
  create(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Transaction>>
  update(id: string, userId: string, data: Partial<Transaction>): Promise<Result<Transaction>>
  delete(id: string, userId: string): Promise<Result<void>>

  // Fixed templates
  findTemplatesByUserId(userId: string): Promise<Result<FixedTemplate[]>>
  createTemplate(data: Omit<FixedTemplate, 'id' | 'createdAt'>): Promise<Result<FixedTemplate>>
  updateTemplate(id: string, userId: string, data: Partial<FixedTemplate>): Promise<Result<FixedTemplate>>
  deleteTemplate(id: string, userId: string): Promise<Result<void>>

  // Populate a month from fixed templates if not done yet
  ensureMonthPopulated(userId: string, month: string): Promise<Result<Transaction[]>>
}
