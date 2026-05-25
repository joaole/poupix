import type { SupabaseClient } from '@supabase/supabase-js'
import type { ICategoryRepository } from '@/domain/interfaces/ICategoryRepository'
import type { Category, Result } from '@/domain/types'
import { DEFAULT_CATEGORIES } from '@/lib/constants'

function mapRow(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    type: row.type as 'income' | 'expense',
    color: row.color as string,
    slug: row.slug as string,
    createdAt: new Date(row.created_at as string),
  }
}

function ok<T>(data: T): Result<T> {
  return { data, error: null }
}
function err<T>(msg: string): Result<T> {
  return { data: null, error: new Error(msg) }
}

export class CategoryRepository implements ICategoryRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findByUserId(userId: string): Promise<Result<Category[]>> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('type', { ascending: false })
      .order('name')
    if (error) return err(error.message)
    return ok((data as Record<string, unknown>[]).map(mapRow))
  }

  async findById(id: string, userId: string): Promise<Result<Category>> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    if (error) return err(error.message)
    return ok(mapRow(data as Record<string, unknown>))
  }

  async create(input: Omit<Category, 'id' | 'createdAt'>): Promise<Result<Category>> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert({
        user_id: input.userId,
        name: input.name,
        type: input.type,
        color: input.color,
        slug: input.slug,
      })
      .select()
      .single()
    if (error) return err(error.message)
    return ok(mapRow(data as Record<string, unknown>))
  }

  async update(id: string, userId: string, patch: Partial<Pick<Category, 'name' | 'color'>>): Promise<Result<Category>> {
    const { data, error } = await this.supabase
      .from('categories')
      .update(patch)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) return err(error.message)
    return ok(mapRow(data as Record<string, unknown>))
  }

  async delete(id: string, userId: string): Promise<Result<void>> {
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) return err(error.message)
    return ok(undefined)
  }

  async seedDefaultCategories(userId: string): Promise<Result<Category[]>> {
    // Check if categories already exist
    const { data: existing } = await this.supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    if (existing && existing.length > 0) {
      return this.findByUserId(userId)
    }

    const rows = DEFAULT_CATEGORIES.map(c => ({
      user_id: userId,
      name: c.name,
      type: c.type,
      color: c.color,
      slug: c.slug,
    }))

    const { data, error } = await this.supabase
      .from('categories')
      .insert(rows)
      .select()
    if (error) return err(error.message)
    return ok((data as Record<string, unknown>[]).map(mapRow))
  }
}
