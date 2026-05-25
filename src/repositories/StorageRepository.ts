import type { SupabaseClient } from '@supabase/supabase-js'
import type { IStorageRepository } from '@/domain/interfaces/IStorageRepository'
import type { Result } from '@/domain/types'

const BUCKET = 'receipts'

function ok<T>(data: T): Result<T> { return { data, error: null } }
function err<T>(msg: string): Result<T> { return { data: null, error: new Error(msg) } }

export class StorageRepository implements IStorageRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async uploadReceipt(userId: string, transactionId: string, file: File): Promise<Result<string>> {
    const ext = file.name.split('.').pop() ?? 'bin'
    const path = `${userId}/${transactionId}/${Date.now()}.${ext}`

    const { error } = await this.supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    })
    if (error) return err(error.message)

    const { data: urlData } = this.supabase.storage.from(BUCKET).getPublicUrl(path)
    return ok(urlData.publicUrl)
  }

  async deleteReceipt(url: string): Promise<Result<void>> {
    // Extract path from URL: …/storage/v1/object/public/receipts/<path>
    const match = url.match(/\/receipts\/(.+)$/)
    if (!match) return err('Invalid receipt URL')
    const { error } = await this.supabase.storage.from(BUCKET).remove([match[1]])
    if (error) return err(error.message)
    return ok(undefined)
  }

  async getSignedUrl(url: string): Promise<Result<string>> {
    const match = url.match(/\/receipts\/(.+)$/)
    if (!match) return err('Invalid receipt URL')
    const { data, error } = await this.supabase.storage
      .from(BUCKET)
      .createSignedUrl(match[1], 3600)
    if (error) return err(error.message)
    return ok(data.signedUrl)
  }
}
