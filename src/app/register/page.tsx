'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CategoryRepository } from '@/repositories/CategoryRepository'
import { CategoryService } from '@/services/CategoryService'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      })
      if (authError) { setError(authError.message); return }
      if (data.user) {
        const repo = new CategoryRepository(supabase)
        const service = new CategoryService(repo)
        await service.ensureDefaultCategories(data.user.id)
        router.replace('/month')
      } else {
        setError('Verifique seu e-mail para confirmar o cadastro.')
      }
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
        <h1 className="auth-title">Criar sua conta</h1>
        <p className="auth-sub">Comece a controlar suas finanças hoje</p>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Seu nome</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Maria Silva"
              required
            />
          </div>
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
              placeholder="mínimo 6 caracteres"
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn primary" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>

        <div className="auth-footer">
          Já tem conta? <Link href="/login">Entrar</Link>
        </div>
      </div>
    </div>
  )
}
