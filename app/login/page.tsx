'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmail, signInWithGoogle } from '@/lib/auth'
import { IconEye, IconEyeOff, IconBrandGoogle, IconQrcode, IconAlertCircle } from '@tabler/icons-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    if (!email) { setError('Email is required'); return }
    if (!password) { setError('Password is required'); return }
    
    setLoading(true)
    try {
      const { error: authError } = await signInWithEmail(email, password)
      if (authError) {
        if (authError.message.includes('Email not confirmed')) {
          setError('Please check your email and confirm your account first.')
        } else if (authError.message.includes('Invalid login credentials')) {
          setError('Wrong email or password. Try signing in with Google instead.')
        } else {
          setError(authError.message)
        }
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setError('Google sign in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
      <Link href="/" className="btn-glow" style={{
        position: 'fixed', top: 20, left: 24,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        color: '#f0eeff', textDecoration: 'none',
        background: 'rgba(108,99,255,0.1)',
        border: '1px solid rgba(108,99,255,0.2)',
        padding: '8px 16px', borderRadius: '20px',
        fontSize: 13, transition: 'all 150ms ease',
        zIndex: 10
      }}>
        ← Back to home
      </Link>
      {/* Grid background */}
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div style={{ 
            width: 40, height: 40, 
            background: 'var(--accent)', 
            borderRadius: 10, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <IconQrcode size={22} color="white" />
          </div>
          <span className="font-geist text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Project QR
          </span>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '40px' }}>
          <h1 className="font-geist text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome back
          </h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Sign in to your account to continue
          </p>

          {/* Google OAuth */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="btn btn-secondary w-full justify-center mb-6"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <IconBrandGoogle size={18} />
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            marginBottom: 24 
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ 
              fontFamily: 'JetBrains Mono, monospace', 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              background: 'rgba(255, 90, 90, 0.08)',
              border: '1px solid rgba(255, 90, 90, 0.2)',
              borderRadius: 8,
              marginBottom: 20,
            }}>
              <IconAlertCircle size={16} color="var(--danger)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="label">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-glow"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p style={{ 
            textAlign: 'center', 
            marginTop: 24, 
            fontSize: '0.875rem',
            color: 'var(--text-secondary)'
          }}>
            Don't have an account?{' '}
            <Link href="/register" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>

        <p style={{ 
          textAlign: 'center', 
          marginTop: 24, 
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          AES-256 Encrypted · SOC 2 Type II
        </p>
      </div>
    </div>
  )
}
