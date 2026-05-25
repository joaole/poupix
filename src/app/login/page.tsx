'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CategoryRepository } from '@/repositories/CategoryRepository'
import { CategoryService } from '@/services/CategoryService'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setError(authError.message); return }
      if (data.user) {
        // Seed default categories if first login
        const repo = new CategoryRepository(supabase)
        const service = new CategoryService(repo)
        await service.ensureDefaultCategories(data.user.id)
      }
      router.replace('/month')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="brand-mark">P</span>
          <span style={{ fontWeight: 600, fontSize: 16 }}>PouPix</span>
        </div>
        <h1 className="auth-title">Entrar na sua conta</h1>
        <p className="auth-sub">Finanças pessoais simples e visuais</p>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="voce@email.com"
              required
            />
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="auth-footer">
          Não tem conta? <Link href="/register">Criar conta</Link>
        </div>
      </div>
    </div>
  )
}
