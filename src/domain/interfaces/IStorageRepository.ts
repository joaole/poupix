import type { Result } from '../types'

export interface IStorageRepository {
  uploadReceipt(userId: string, transactionId: string, file: File): Promise<Result<string>>
  deleteReceipt(url: string): Promise<Result<void>>
  getSignedUrl(url: string): Promise<Result<string>>
}
