'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { IconBrandGoogle, IconQrcode, IconAlertCircle } from '@tabler/icons-react'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleGoogle() {
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
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
          <p className="mb-8" style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', fontFamily: 'Inter, sans-serif' }}>
            Start managing industrial assets digitally
          </p>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              background: 'rgba(255, 90, 90, 0.08)',
              border: '1px solid rgba(255, 90, 90, 0.2)',
              borderRadius: 8, marginBottom: 20,
            }}>
              <IconAlertCircle size={16} color="var(--danger)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--danger)', fontFamily: 'Inter, sans-serif' }}>{error}</span>
            </div>
          )}

          {/* Google */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="btn btn-primary btn-glow w-full justify-center"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <IconBrandGoogle size={18} />
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: '0.875rem', color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent-light)', textDecoration: 'none' }}>
              Sign in
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
