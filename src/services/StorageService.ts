import type { IStorageRepository } from '@/domain/interfaces/IStorageRepository'
import type { Result } from '@/domain/types'

export class StorageService {
  constructor(private readonly repo: IStorageRepository) {}

  async uploadReceipt(userId: string, transactionId: string, file: File): Promise<Result<string>> {
    const maxBytes = 10 * 1024 * 1024 // 10 MB
    if (file.size > maxBytes) {
      return { data: null, error: new Error('Arquivo muito grande (máx 10 MB)') }
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) {
      return { data: null, error: new Error('Tipo de arquivo não suportado') }
    }
    return this.repo.uploadReceipt(userId, transactionId, file)
  }

  async deleteReceipt(url: string): Promise<Result<void>> {
    return this.repo.deleteReceipt(url)
  }

  async getSignedUrl(url: string): Promise<Result<string>> {
    return this.repo.getSignedUrl(url)
  }
}
