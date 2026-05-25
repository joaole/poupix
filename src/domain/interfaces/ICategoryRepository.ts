import type { Category, Result } from '../types'

export interface ICategoryRepository {
  findByUserId(userId: string): Promise<Result<Category[]>>
  findById(id: string, userId: string): Promise<Result<Category>>
  create(data: Omit<Category, 'id' | 'createdAt'>): Promise<Result<Category>>
  update(id: string, userId: string, data: Partial<Pick<Category, 'name' | 'color'>>): Promise<Result<Category>>
  delete(id: string, userId: string): Promise<Result<void>>
  seedDefaultCategories(userId: string): Promise<Result<Category[]>>
}
