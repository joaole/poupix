import type { SupabaseClient } from '@supabase/supabase-js'
import type { ITransactionRepository } from '@/domain/interfaces/ITransactionRepository'
import type { Transaction, FixedTemplate, Result } from '@/domain/types'

function mapTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as 'income' | 'expense',
    description: row.description as string,
    categoryId: row.category_id as string,
    isFixed: row.is_fixed as boolean,
    fixedTemplateId: (row.fixed_template_id as string) ?? null,
    referenceMonth: row.reference_month as string,
    scheduledDate: new Date(row.scheduled_date as string),
    predictedAmount: Number(row.predicted_amount),
    paidAmount: row.paid_amount !== null && row.paid_amount !== undefined ? Number(row.paid_amount) : null,
    paidAt: row.paid_at ? new Date(row.paid_at as string) : null,
    notes: (row.notes as string) ?? '',
    attachmentUrl: (row.attachment_url as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function mapTemplate(row: Record<string, unknown>): FixedTemplate {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    type: row.type as 'income' | 'expense',
    description: row.description as string,
    categoryId: row.category_id as string,
    dayOfMonth: row.day_of_month as number,
    predictedAmount: Number(row.predicted_amount),
    isDynamic: row.is_dynamic as boolean,
    isActive: row.is_active as boolean,
    createdAt: new Date(row.created_at as string),
  }
}

function ok<T>(data: T): Result<T> { return { data, error: null } }
function err<T>(msg: string): Result<T> { return { data: null, error: new Error(msg) } }

export class TransactionRepository implements ITransactionRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByMonth(userId: string, month: string): Promise<Result<Transaction[]>> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('reference_month', month)
      .order('scheduled_date')
    if (error) return err(error.message)
    return ok((data as Record<string, unknown>[]).map(mapTransaction))
  }

  async findByDateRange(userId: string, fromMonth: string, toMonth: string): Promise<Result<Transaction[]>> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('reference_month', fromMonth)
      .lte('reference_month', toMonth)
      .order('reference_month')
      .order('scheduled_date')
    if (error) return err(error.message)
    return ok((data as Record<string, unknown>[]).map(mapTransaction))
  }

  async findById(id: string, userId: string): Promise<Result<Transaction>> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (error) return err(error.message)
    return ok(mapTransaction(data as Record<string, unknown>))
  }

  async create(input: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Result<Transaction>> {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert({
        user_id: input.userId,
        type: input.type,
        description: input.description,
        category_id: input.categoryId,
        is_fixed: input.isFixed,
        fixed_template_id: input.fixedTemplateId,
        reference_month: input.referenceMonth,
        scheduled_date: input.scheduledDate.toISOString().split('T')[0],
        predicted_amount: input.predictedAmount,
        paid_amount: input.paidAmount,
        paid_at: input.paidAt ? input.paidAt.toISOString().split('T')[0] : null,
        notes: input.notes ?? '',
        attachment_url: input.attachmentUrl,
      })
      .select()
      .single()
    if (error) return err(error.message)
    return ok(mapTransaction(data as Record<string, unknown>))
  }

  async update(id: string, userId: string, patch: Partial<Transaction>): Promise<Result<Transaction>> {
    const dbPatch: Record<string, unknown> = {}
    if (patch.description !== undefined) dbPatch.description = patch.description
    if (patch.categoryId !== undefined) dbPatch.category_id = patch.categoryId
    if (patch.predictedAmount !== undefined) dbPatch.predicted_amount = patch.predictedAmount
    if (patch.paidAmount !== undefined) dbPatch.paid_amount = patch.paidAmount
    if (patch.paidAt !== undefined) dbPatch.paid_at = patch.paidAt ? (patch.paidAt instanceof Date ? patch.paidAt.toISOString().split('T')[0] : patch.paidAt) : null
    if (patch.notes !== undefined) dbPatch.notes = patch.notes
    if (patch.attachmentUrl !== undefined) dbPatch.attachment_url = patch.attachmentUrl
    if (patch.isFixed !== undefined) dbPatch.is_fixed = patch.isFixed
    if (patch.scheduledDate !== undefined) dbPatch.scheduled_date = patch.scheduledDate instanceof Date ? patch.scheduledDate.toISOString().split('T')[0] : patch.scheduledDate

    const { data, error } = await this.supabase
      .from('transactions')
      .update(dbPatch)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) return err(error.message)
    return ok(mapTransaction(data as Record<string, unknown>))
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return err(error.message)
    return ok(undefined)
  }

  async findTemplatesByUserId(userId: string): Promise<Result<FixedTemplate[]>> {
    const { data, error } = await this.supabase
      .from('fixed_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('day_of_month')
    if (error) return err(error.message)
    return ok((data as Record<string, unknown>[]).map(mapTemplate))
  }

  async createTemplate(input: Omit<FixedTemplate, 'id' | 'createdAt'>): Promise<Result<FixedTemplate>> {
    const { data, error } = await this.supabase
      .from('fixed_templates')
      .insert({
        user_id: input.userId,
        type: input.type,
        description: input.description,
        category_id: input.categoryId,
        day_of_month: input.dayOfMonth,
        predicted_amount: input.predictedAmount,
        is_dynamic: input.isDynamic,
        is_active: input.isActive,
      })
      .select()
      .single()
    if (error) return err(error.message)
    return ok(mapTemplate(data as Record<string, unknown>))
  }

  async updateTemplate(id: string, userId: string, patch: Partial<FixedTemplate>): Promise<Result<FixedTemplate>> {
    const dbPatch: Record<string, unknown> = {}
    if (patch.description !== undefined) dbPatch.description = patch.description
    if (patch.categoryId !== undefined) dbPatch.category_id = patch.categoryId
    if (patch.predictedAmount !== undefined) dbPatch.predicted_amount = patch.predictedAmount
    if (patch.isDynamic !== undefined) dbPatch.is_dynamic = patch.isDynamic
    if (patch.isActive !== undefined) dbPatch.is_active = patch.isActive

    const { data, error } = await this.supabase
      .from('fixed_templates')
      .update(dbPatch)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) return err(error.message)
    return ok(mapTemplate(data as Record<string, unknown>))
  }

  async deleteTemplate(id: string, userId: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('fixed_templates')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return err(error.message)
    return ok(undefined)
  }

  async ensureMonthPopulated(userId: string, month: string): Promise<Result<Transaction[]>> {
    // Check if there are already fixed transactions for this month
    const { data: existing } = await this.supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('reference_month', month)
      .eq('is_fixed', true)
      .limit(1)

    if (existing && existing.length > 0) {
      return this.findByMonth(userId, month)
    }

    // Populate from templates
    const templatesResult = await this.findTemplatesByUserId(userId)
    if (templatesResult.error) return err(templatesResult.error.message)

    const templates = templatesResult.data
    if (templates.length === 0) return this.findByMonth(userId, month)

    const [y, m] = month.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()

    const rows = templates
      .filter(t => !t.isDynamic || t.predictedAmount > 0)
      .map(t => ({
        user_id: userId,
        type: t.type,
        description: t.description,
        category_id: t.categoryId,
        is_fixed: true,
        fixed_template_id: t.id,
        reference_month: month,
        scheduled_date: `${y}-${String(m).padStart(2, '0')}-${String(Math.min(t.dayOfMonth, lastDay)).padStart(2, '0')}`,
        predicted_amount: t.predictedAmount,
        paid_amount: null,
        paid_at: null,
        notes: '',
        attachment_url: null,
      }))

    if (rows.length > 0) {
      const { error: insertError } = await this.supabase.from('transactions').insert(rows)
      if (insertError) return err(insertError.message)
    }

    return this.findByMonth(userId, month)
  }
}
