import type { ICategoryRepository } from '@/domain/interfaces/ICategoryRepository'
import type { Category, Result } from '@/domain/types'

export class CategoryService {
  constructor(private readonly repo: ICategoryRepository) {}

  async getCategories(userId: string): Promise<Result<Category[]>> {
    return this.repo.findByUserId(userId)
  }

  async ensureDefaultCategories(userId: string): Promise<Result<Category[]>> {
    return this.repo.seedDefaultCategories(userId)
  }

  buildCategoryMap(categories: Category[]): Map<string, Category> {
    return new Map(categories.map(c => [c.id, c]))
  }

  buildCategorySlugMap(categories: Category[]): Map<string, Category> {
    return new Map(categories.map(c => [c.slug, c]))
  }
}
