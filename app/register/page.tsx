'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth'
import { IconEye, IconEyeOff, IconBrandGoogle, IconQrcode, IconAlertCircle, IconCheck } from '@tabler/icons-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  function validatePassword(p: string) {
    if (p.length < 8) return 'Password must be at least 8 characters'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Name is required'); return }
    if (!email) { setError('Email is required'); return }
    const pwErr = validatePassword(password)
    if (pwErr) { setError(pwErr); return }

    setLoading(true)
    try {
      const { data, error: authError } = await signUpWithEmail(email, password, name)
      if (authError) {
        setError(authError.message)
      } else if (data.user && !data.session) {
        setSuccess(true)
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-base)' }}>
        <div className="text-center animate-fade-up" style={{ maxWidth: 440 }}>
          <div style={{
            width: 64, height: 64,
            background: 'rgba(61, 255, 160, 0.1)',
            border: '1px solid rgba(61, 255, 160, 0.3)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <IconCheck size={32} color="var(--success)" />
          </div>
          <h1 className="font-geist text-2xl font-bold mb-3">Check your email</h1>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            We sent a confirmation link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>. 
            Click it to activate your account.
          </p>
          <Link href="/login" className="btn btn-primary btn-glow" style={{ display: 'inline-flex', marginTop: 32 }}>
            Go to Login
          </Link>
        </div>
      </div>
    )
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
      <div className="fixed inset-0 grid-bg opacity-50 pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div style={{ 
            width: 40, height: 40, 
            background: 'var(--accent)', 
            borderRadius: 10, 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <IconQrcode size={22} color="white" />
          </div>
          <span className="font-geist text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Project QR
          </span>
        </div>

        <div className="card" style={{ padding: '40px' }}>
          <h1 className="font-geist text-2xl font-bold mb-2">Create your account</h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Start managing industrial assets digitally
          </p>

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}
          >
            <IconBrandGoogle size={18} />
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              background: 'rgba(255, 90, 90, 0.08)',
              border: '1px solid rgba(255, 90, 90, 0.2)',
              borderRadius: 8, marginBottom: 20,
            }}>
              <IconAlertCircle size={16} color="var(--danger)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                placeholder="John Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

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
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
              {password && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: '8+ chars', met: password.length >= 8 },
                    { label: 'Uppercase', met: /[A-Z]/.test(password) },
                    { label: 'Number', met: /[0-9]/.test(password) },
                  ].map(r => (
                    <span key={r.label} style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: r.met ? 'rgba(61,255,160,0.1)' : 'rgba(255,255,255,0.05)',
                      color: r.met ? 'var(--success)' : 'var(--text-muted)',
                      border: `1px solid ${r.met ? 'rgba(61,255,160,0.2)' : 'var(--border)'}`,
                    }}>
                      {r.label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-glow"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
