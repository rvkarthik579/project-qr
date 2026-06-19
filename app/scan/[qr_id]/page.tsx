'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

// CRITICAL: Use anonymous client — NO auth required for scanning
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface QRData {
  id: string
  qr_unique_id: string
  is_active: boolean
  expiry_date: string | null
  password_hash: string | null
  files: {
    id: string
    file_name: string
    file_path: string
    file_type: string
    file_size: number
  }
  reports: {
    status: string
    remarks: string | null
    next_inspection_date: string | null
  }
}

export default function ScanPage({ params }: { params: { qr_id: string } }) {
  const qrId = (params as { qr_id: string }).qr_id
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [status, setStatus] = useState<'loading' | 'valid' | 'expired' | 'revoked' | 'invalid' | 'pin'>('loading')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinAttempts, setPinAttempts] = useState(0)
  const [fileUrl, setFileUrl] = useState('')

  useEffect(() => {
    loadQR()
  }, [qrId])

  async function loadQR() {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*, files(*), reports(*)')
        .eq('qr_unique_id', qrId)
        .single()

      if (error || !data) {
        setStatus('invalid')
        return
      }

      // Log scan attempt
      await supabase.from('scan_logs').insert({
        qr_id: data.id,
        scanned_at: new Date().toISOString(),
        device_type: navigator.userAgent,
        was_blocked: false
      })

      if (!data.is_active) {
        setStatus('revoked')
        return
      }

      if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
        // Log blocked scan
        await supabase.from('scan_logs').insert({
          qr_id: data.id,
          scanned_at: new Date().toISOString(),
          was_blocked: true,
          block_reason: 'expired'
        })
        setStatus('expired')
        return
      }

      setQrData(data)

      if (data.password_hash) {
        setStatus('pin')
      } else {
        await loadFileUrl(data.files.file_path)
        setStatus('valid')
      }

    } catch (err) {
      console.error('Scan error:', err)
      setStatus('invalid')
    }
  }

  async function loadFileUrl(filePath: string) {
    const { data } = await supabase.storage
      .from('project-qr-files')
      .createSignedUrl(filePath, 3600)
    if (data?.signedUrl) setFileUrl(data.signedUrl)
  }

  async function verifyPin() {
    if (pin.length !== 4) return
    if (pinAttempts >= 3) return

    try {
      const response = await fetch('/api/qr/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pin, 
          passwordHash: qrData?.password_hash 
        })
      })
      const { valid } = await response.json()

      if (valid) {
        await loadFileUrl(qrData!.files.file_path)
        setStatus('valid')
      } else {
        setPinAttempts(a => a + 1)
        setPinError(pinAttempts >= 2 ? 'Too many attempts. Access locked.' : 'Wrong PIN. Try again.')
        setPin('')
        if (pinAttempts >= 2) {
          await supabase.from('scan_logs').insert({
            qr_id: qrData!.id,
            scanned_at: new Date().toISOString(),
            was_blocked: true,
            block_reason: 'too_many_pin_attempts'
          })
        }
      }
    } catch {
      setPinError('Verification failed. Try again.')
    }
  }

  // STATUS: LOADING
  if (status === 'loading') return (
    <div style={{
      minHeight: '100vh', background: '#07080f',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid rgba(108,99,255,0.3)',
        borderTopColor: '#6c63ff',
        animation: 'spin 600ms linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // STATUS: INVALID
  if (status === 'invalid') return (
    <div style={{
      minHeight: '100vh', background: '#07080f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <h1 style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: 22, fontWeight: 700, color: '#f0eeff', marginBottom: 8
        }}>Invalid QR Code</h1>
        <p style={{ color: '#9896b8', fontSize: 14 }}>
          This QR code does not exist or has been removed.
        </p>
      </div>
    </div>
  )

  // STATUS: REVOKED
  if (status === 'revoked') return (
    <div style={{
      minHeight: '100vh', background: '#07080f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
        <h1 style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: 22, fontWeight: 700, color: '#ff5a5a', marginBottom: 8
        }}>Access Revoked</h1>
        <p style={{ color: '#9896b8', fontSize: 14 }}>
          This QR code has been revoked by the owner.
        </p>
      </div>
    </div>
  )

  // STATUS: EXPIRED
  if (status === 'expired') return (
    <div style={{
      minHeight: '100vh', background: '#07080f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⏰</div>
        <h1 style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: 22, fontWeight: 700, color: '#f0c060', marginBottom: 8
        }}>QR Code Expired</h1>
        <p style={{ color: '#9896b8', fontSize: 14 }}>
          This QR code expired on{' '}
          {qrData?.expiry_date 
            ? new Date(qrData.expiry_date).toLocaleDateString() 
            : 'an unknown date'}.
        </p>
      </div>
    </div>
  )

  // STATUS: PIN
  if (status === 'pin') return (
    <div style={{
      minHeight: '100vh', background: '#07080f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 320, width: '100%' }}>
        <div style={{
          width: 64, height: 64,
          background: 'rgba(108,99,255,0.1)',
          border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: 16, margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28
        }}>🔒</div>
        <h1 style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: 22, fontWeight: 700, color: '#f0eeff', marginBottom: 8
        }}>PIN Required</h1>
        <p style={{ color: '#9896b8', fontSize: 14, marginBottom: 32 }}>
          Enter the 4-digit PIN to access this file.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
          {[0,1,2,3].map(i => (
            <input
              key={i}
              type="text"
              maxLength={1}
              value={pin[i] || ''}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '')
                const newPin = pin.split('')
                newPin[i] = val
                const joined = newPin.join('').slice(0, 4)
                setPin(joined)
                if (val && i < 3) {
                  const next = document.getElementById(`pin-${i+1}`)
                  next?.focus()
                }
              }}
              id={`pin-${i}`}
              style={{
                width: 56, height: 64,
                background: '#0d0f1a',
                border: `1px solid ${pinError ? 'rgba(255,90,90,0.4)' : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 10,
                color: '#f0eeff', fontSize: 24,
                fontFamily: 'JetBrains Mono, monospace',
                textAlign: 'center', outline: 'none'
              }}
            />
          ))}
        </div>
        {pinError && (
          <p style={{ color: '#ff5a5a', fontSize: 13, marginBottom: 16 }}>
            {pinError}
          </p>
        )}
        <button
          onClick={verifyPin}
          disabled={pin.length !== 4 || pinAttempts >= 3}
          style={{
            width: '100%', padding: '14px',
            background: pin.length === 4 ? '#6c63ff' : '#1a1a2e',
            color: pin.length === 4 ? 'white' : '#5e5c80',
            border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 600,
            fontFamily: 'Geist, sans-serif',
            cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
            transition: 'all 150ms ease'
          }}
        >
          Unlock
        </button>
      </div>
    </div>
  )

  // STATUS: VALID — Main scan view
  return (
    <div style={{
      minHeight: '100vh', background: '#07080f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#5e5c80',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 8
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#3dffa0', boxShadow: '0 0 6px #3dffa0'
            }} />
            Project QR
          </div>
        </div>

        {/* Status badge */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 24
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '8px 20px', borderRadius: 24,
            background: qrData?.reports?.status === 'pass' 
              ? 'rgba(61,255,160,0.1)' 
              : qrData?.reports?.status === 'fail'
              ? 'rgba(255,90,90,0.1)'
              : 'rgba(240,192,96,0.1)',
            color: qrData?.reports?.status === 'pass' ? '#3dffa0'
              : qrData?.reports?.status === 'fail' ? '#ff5a5a'
              : '#f0c060',
            border: `1px solid ${
              qrData?.reports?.status === 'pass' ? 'rgba(61,255,160,0.2)'
              : qrData?.reports?.status === 'fail' ? 'rgba(255,90,90,0.2)'
              : 'rgba(240,192,96,0.2)'
            }`
          }}>
            {qrData?.reports?.status === 'pass' ? '✓ Pass'
              : qrData?.reports?.status === 'fail' ? '✕ Fail'
              : '⚠ Needs Attention'}
          </span>
        </div>

        {/* File card */}
        <div style={{
          background: '#0d0f1a',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: 24, marginBottom: 16
        }}>
          <p style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, color: '#5e5c80',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            marginBottom: 8
          }}>File</p>
          <p style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: 18, fontWeight: 700, color: '#f0eeff',
            marginBottom: 4, wordBreak: 'break-all'
          }}>
            {qrData?.files?.file_name}
          </p>
          <p style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#5e5c80'
          }}>
            {qrData?.files?.file_size 
              ? `${(qrData.files.file_size / 1024 / 1024).toFixed(1)} MB`
              : ''
            }
          </p>
        </div>

        {/* Remarks */}
        {qrData?.reports?.remarks && (
          <div style={{
            background: '#0d0f1a',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: 16, marginBottom: 16
          }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10, color: '#5e5c80',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 8
            }}>Remarks</p>
            <p style={{ fontSize: 14, color: '#9896b8', lineHeight: 1.6 }}>
              {qrData.reports.remarks}
            </p>
          </div>
        )}

        {/* Next inspection */}
        {qrData?.reports?.next_inspection_date && (
          <div style={{
            background: 'rgba(108,99,255,0.06)',
            border: '1px solid rgba(108,99,255,0.15)',
            borderRadius: 12, padding: 14, marginBottom: 16
          }}>
            <p style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10, color: '#5e5c80',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              marginBottom: 4
            }}>Next Inspection</p>
            <p style={{ fontSize: 14, color: '#a89cff', fontWeight: 500 }}>
              {new Date(qrData.reports.next_inspection_date).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* QR ID */}
        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10, color: '#5e5c80',
          textAlign: 'center', marginBottom: 24,
          letterSpacing: '0.08em'
        }}>
          ID: {qrData?.qr_unique_id}
        </p>

        {/* Download button */}
        {fileUrl ? (
          <a
            href={fileUrl}
            download={qrData?.files?.file_name}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, width: '100%', padding: '16px',
              background: '#6c63ff', color: 'white',
              borderRadius: 12, fontSize: 16, fontWeight: 600,
              fontFamily: 'Geist, sans-serif',
              textDecoration: 'none',
              boxShadow: '0 0 24px rgba(108,99,255,0.3)'
            }}
          >
            ↓ Download File
          </a>
        ) : (
          <button style={{
            width: '100%', padding: '16px',
            background: '#1a1a2e', color: '#5e5c80',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, fontSize: 15,
            fontFamily: 'Geist, sans-serif', cursor: 'not-allowed'
          }}>
            Preparing download...
          </button>
        )}

      </div>
    </div>
  )
}
