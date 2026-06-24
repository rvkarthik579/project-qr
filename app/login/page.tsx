'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { IconBrandGoogle, IconQrcode, IconAlertCircle, IconArrowLeft } from '@tabler/icons-react'
import RoutingCanvas from '@/components/ui/RoutingCanvas'

export default function LoginPage() {
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
    <div className="landing-premium" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <RoutingCanvas />
      
      <div style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 20 }}>
        <Link href="/" className="premium-btn premium-btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}>
          <IconArrowLeft size={16} />
          Back to home
        </Link>
      </div>
      
      <div className="premium-container" style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '440px', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/retriqo-logo.svg" alt="Retriqo" style={{ height: '40px', margin: '0 auto 1.5rem auto', display: 'block' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.75rem', color: '#fff' }}>
            Access Your Archive
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.5 }}>
            Retrieve, manage, and secure your industrial records.
          </p>
        </div>

        <div style={{ 
          background: 'rgba(255, 255, 255, 0.02)', 
          border: '1px solid rgba(255, 255, 255, 0.05)', 
          borderRadius: '24px', 
          padding: '2.5rem',
          backdropFilter: 'blur(20px)'
        }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px',
              background: 'rgba(255, 90, 90, 0.08)',
              border: '1px solid rgba(255, 90, 90, 0.2)',
              borderRadius: '12px', marginBottom: '1.5rem',
            }}>
              <IconAlertCircle size={16} color="var(--danger)" />
              <span style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>{error}</span>
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="premium-btn premium-btn-primary"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}
          >
            <IconBrandGoogle size={20} />
            {googleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
              Don't have an account?{' '}
              <Link href="/register" style={{ color: '#fff', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '2px', transition: 'border-color 0.2s' }} onMouseOver={e => e.currentTarget.style.borderBottomColor = '#fff'} onMouseOut={e => e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.3)'}>
                Create one
              </Link>
            </p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <p className="mono" style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
            AES-256 ENCRYPTED · SOC 2 TYPE II
          </p>
        </div>
      </div>
    </div>
  )
}
