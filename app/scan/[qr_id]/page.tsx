'use client'

import { useEffect, useState } from 'react'

interface QRData {
  fileName: string
  fileUrl: string
  downloadUrl?: string
  fileSize: number
  status: string
  machineName: string
  reportDate: string
  expiryDate?: string
  remarks?: string
  nextInspectionDate?: string
  companyName?: string
  uploaderName?: string
  requiresPin: boolean
}

export default function ScanPage({ params }: { params: { qr_id: string } }) {
  const qrId = params.qr_id
  const [qrData, setQrData] = useState<QRData | null>(null)
  const [status, setStatus] = useState<'loading' | 'valid' | 'expired' | 'revoked' | 'invalid' | 'pin' | 'locked' | 'not_found' | 'server_error'>('loading')
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)

  useEffect(() => {
    loadQR()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrId])

  useEffect(() => {
    if (status === 'locked' && secondsRemaining && secondsRemaining > 0) {
      const timer = setInterval(() => {
        setSecondsRemaining(prev => prev ? prev - 1 : 0)
      }, 1000)
      return () => clearInterval(timer)
    } else if (status === 'locked' && secondsRemaining === 0) {
      loadQR()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, secondsRemaining])

  async function loadQR(pinToVerify?: string) {
    try {
      const body: Record<string, string> = {}
      if (pinToVerify) body.pin = pinToVerify
      
      const res = await fetch(`/api/qr/scan/${qrId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      const result = await res.json().catch(() => ({}))

      if (res.status === 404) {
        setStatus('not_found')
        return
      } else if (res.status === 403) {
        setStatus('revoked')
        return
      } else if (res.status === 410) {
        setStatus('expired')
        if (result.expiryDate) {
          setQrData({ ...result.data, expiryDate: result.expiryDate } as QRData)
        }
        return
      } else if (res.status === 423) {
        setStatus('locked')
        setSecondsRemaining(result.secondsRemaining || 900)
        return
      } else if (res.status === 500 || res.status >= 500) {
        setStatus('server_error')
        return
      } else if (res.status !== 200 && result.status !== 'pin_required' && result.status !== 'wrong_pin') {
        setStatus('invalid')
        return
      }

      if (result.status === 'pin_required') {
        setStatus('pin')
      } else if (result.status === 'wrong_pin') {
        setStatus('pin')
        setPinError('Incorrect PIN')
        setAttemptsLeft(result.attemptsLeft)
      } else if (result.status === 'valid') {
        setQrData(result.data)
        setStatus('valid')
      } else {
        setStatus('invalid')
      }
    } catch (err) {
      console.error('Scan error:', err)
      setStatus('server_error')
    }
  }

  function handlePreview() {
    if (!qrData?.fileUrl) return
    const ext = qrData.fileName.split('.').pop()?.toLowerCase()
    
    // Preview logic
    if (ext === 'pdf' || ext === 'txt' || ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'gif' || ext === 'webp' || ext === 'mp4') {
      window.open(qrData.fileUrl, '_blank')
    } else if (ext === 'docx' || ext === 'doc') {
      // Use Google Docs Viewer or Office Viewer for DOCX
      const encodedUrl = encodeURIComponent(qrData.fileUrl)
      window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`, '_blank')
    } else {
      alert("Preview unavailable for this file type. Please download the file.")
    }
  }

  // STATUS: LOADING
  if (status === 'loading') return (
    <div style={{
      minHeight: '100vh', background: '#07080f',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid rgba(108,99,255,0.3)',
        borderTopColor: '#6c63ff',
        animation: 'spin 800ms linear infinite',
        marginBottom: 24
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#9896b8', fontFamily: 'Geist, sans-serif', fontSize: 16 }}>Loading report details...</p>
    </div>
  )

  // STATUS: NOT FOUND
  if (status === 'not_found') return (
    <div style={{
      minHeight: '100vh', background: '#07080f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 700, color: '#f0eeff', marginBottom: 8 }}>QR Not Found</h1>
        <p style={{ color: '#9896b8', fontSize: 16, lineHeight: 1.5 }}>This QR code does not exist in our system.</p>
      </div>
    </div>
  )

  // STATUS: SERVER ERROR
  if (status === 'server_error') return (
    <div style={{
      minHeight: '100vh', background: '#07080f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💥</div>
        <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 700, color: '#ff5a5a', marginBottom: 8 }}>Server Error</h1>
        <p style={{ color: '#9896b8', fontSize: 16, lineHeight: 1.5 }}>There was a problem verifying this QR code. Please try again later.</p>
      </div>
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
        <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
        <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 700, color: '#f0eeff', marginBottom: 8 }}>Invalid QR Code</h1>
        <p style={{ color: '#9896b8', fontSize: 16, lineHeight: 1.5 }}>This QR code is invalid or the data is malformed.</p>
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
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 700, color: '#ff5a5a', marginBottom: 8 }}>Access Revoked</h1>
        <p style={{ color: '#9896b8', fontSize: 16, lineHeight: 1.5 }}>This QR code has been revoked by the owner.</p>
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
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f0c060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: 16, margin: '0 auto'}}>
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 700, color: '#f0c060', marginBottom: 8 }}>QR Code Expired</h1>
        <p style={{ color: '#9896b8', fontSize: 16, lineHeight: 1.5, marginBottom: 24 }}>
          This link expired on {qrData?.expiryDate ? new Date(qrData.expiryDate).toLocaleDateString() : 'its set expiry date'}.
        </p>
        <p style={{ color: '#5e5c80', fontSize: 14 }}>Please contact your administrator to generate a new QR code.</p>
      </div>
    </div>
  )

  // STATUS: LOCKED
  if (status === 'locked') return (
    <div style={{
      minHeight: '100vh', background: '#07080f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏱️</div>
        <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 700, color: '#ff5a5a', marginBottom: 8 }}>Access Locked</h1>
        <p style={{ color: '#9896b8', fontSize: 16, lineHeight: 1.5, marginBottom: 16 }}>
          Too many failed PIN attempts.
        </p>
        {secondsRemaining !== null && secondsRemaining > 0 && (
          <div style={{ 
            background: 'rgba(255,90,90,0.1)', 
            padding: '12px 24px', 
            borderRadius: 12, 
            display: 'inline-block',
            color: '#ff5a5a',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 20,
            fontWeight: 700
          }}>
            {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')}
          </div>
        )}
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
      <div style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}>
        <div style={{
          width: 72, height: 72,
          background: 'rgba(108,99,255,0.1)',
          border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: 20, margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h1 style={{ fontFamily: 'Geist, sans-serif', fontSize: 24, fontWeight: 700, color: '#f0eeff', marginBottom: 8 }}>PIN Required</h1>
        <p style={{ color: '#9896b8', fontSize: 16, marginBottom: 32 }}>Enter the 4-digit PIN to view this report.</p>
        
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24 }}>
          {[0,1,2,3].map(i => (
            <input
              key={i}
              type="tel"
              inputMode="numeric"
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
              onKeyDown={e => {
                if (e.key === 'Backspace' && !pin[i] && i > 0) {
                  const prev = document.getElementById(`pin-${i-1}`)
                  prev?.focus()
                }
                if (e.key === 'Enter' && pin.length === 4) {
                  loadQR(pin)
                }
              }}
              id={`pin-${i}`}
              style={{
                width: 64, height: 72,
                background: '#0d0f1a',
                border: `1.5px solid ${pinError ? 'rgba(255,90,90,0.5)' : pin[i] ? '#6c63ff' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 12,
                color: '#f0eeff', fontSize: 28,
                fontFamily: 'JetBrains Mono, monospace',
                textAlign: 'center', outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          ))}
        </div>
        {pinError && (
          <div style={{ color: '#ff5a5a', fontSize: 14, marginBottom: 16 }}>
            {pinError} {attemptsLeft !== null && `(${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left)`}
          </div>
        )}
        <button
          onClick={() => loadQR(pin)}
          disabled={pin.length !== 4}
          style={{
            width: '100%', padding: '16px',
            background: pin.length === 4 ? '#6c63ff' : '#1a1a2e',
            color: pin.length === 4 ? 'white' : '#5e5c80',
            border: 'none', borderRadius: 12,
            fontSize: 16, fontWeight: 600,
            fontFamily: 'Geist, sans-serif',
            cursor: pin.length === 4 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            minHeight: 56 // 44px minimum + padding
          }}
        >
          Unlock Report
        </button>
      </div>
    </div>
  )

  // STATUS: VALID — Main scan view
  return (
    <div style={{
      minHeight: '100vh', background: '#07080f',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '32px 16px', fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        
        {/* Retriqo Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12, color: '#5e5c80',
            letterSpacing: '0.15em', textTransform: 'uppercase',
            fontWeight: 600
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#3dffa0', boxShadow: '0 0 10px rgba(61,255,160,0.5)'
            }} />
            Retriqo
          </div>
        </div>

        {/* Visual Preview */}
        <div style={{
          width: '100%', height: 200, marginBottom: 32, borderRadius: 16, overflow: 'hidden',
          background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {(() => {
            const ext = qrData?.fileName.split('.').pop()?.toLowerCase();
            if (!qrData?.fileUrl) return null;
            
            if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) {
              // eslint-disable-next-line @next/next/no-img-element
              return <img src={qrData.fileUrl} alt={qrData.fileName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            }
            if (ext === 'pdf') {
              // Iframe for PDF preview (browser native)
              return <iframe src={`${qrData.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} title="PDF Preview" />
            }
            if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
              return (
                <div style={{ textAlign: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6c63ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px auto' }}>
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><line x1="12" y1="22" x2="12" y2="12"></line>
                  </svg>
                  <p style={{ color: '#f0eeff', fontSize: 14, fontFamily: 'Geist, sans-serif' }}>Archive File</p>
                  <p style={{ color: '#5e5c80', fontSize: 12, marginTop: 4 }}>Contains multiple files</p>
                </div>
              )
            }
            if (['doc', 'docx'].includes(ext || '')) {
              return (
                <div style={{ textAlign: 'center' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px auto' }}>
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  <p style={{ color: '#f0eeff', fontSize: 14, fontFamily: 'Geist, sans-serif' }}>Word Document</p>
                </div>
              )
            }
            
            // Default file icon
            return (
              <div style={{ textAlign: 'center' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9896b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 12px auto' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <p style={{ color: '#f0eeff', fontSize: 14, fontFamily: 'Geist, sans-serif' }}>{qrData.fileName}</p>
              </div>
            )
          })()}
        </div>

        {/* Machine Name */}
        <h1 style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: 32, fontWeight: 800, color: '#f0eeff',
          textAlign: 'center', marginBottom: 16,
          lineHeight: 1.2
        }}>
          {qrData?.machineName}
        </h1>

        {/* Status */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 14, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '10px 24px', borderRadius: 32,
            background: qrData?.status === 'pass' ? 'rgba(61,255,160,0.1)' 
                      : qrData?.status === 'fail' ? 'rgba(255,90,90,0.1)'
                      : 'rgba(240,192,96,0.1)',
            color: qrData?.status === 'pass' ? '#3dffa0'
                 : qrData?.status === 'fail' ? '#ff5a5a'
                 : '#f0c060',
            border: `1px solid ${
              qrData?.status === 'pass' ? 'rgba(61,255,160,0.25)'
              : qrData?.status === 'fail' ? 'rgba(255,90,90,0.25)'
              : 'rgba(240,192,96,0.25)'
            }`,
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            {qrData?.status === 'pass' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              : qrData?.status === 'fail' ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>}
            {qrData?.status === 'pass' ? 'PASS'
              : qrData?.status === 'fail' ? 'FAIL'
              : 'NEEDS ATTENTION'}
          </span>
        </div>

        {/* Data Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
          
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Date */}
            <div style={{
              flex: 1, background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: 16, padding: 20
            }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#5e5c80', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Inspection Date</p>
              <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 600, color: '#f0eeff' }}>
                {qrData?.reportDate ? new Date(qrData.reportDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) : '—'}
              </p>
            </div>

            {/* Next Inspection */}
            {qrData?.nextInspectionDate && (
              <div style={{
                flex: 1, background: 'rgba(108,99,255,0.05)', border: '1px solid rgba(108,99,255,0.15)',
                borderRadius: 16, padding: 20
              }}>
                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#8884d8', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Next Inspection</p>
                <p style={{ fontFamily: 'Geist, sans-serif', fontSize: 18, fontWeight: 600, color: '#a89cff' }}>
                  {new Date(qrData.nextInspectionDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                </p>
              </div>
            )}
          </div>

          {/* Remarks */}
          {qrData?.remarks && (
            <div style={{ background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 20 }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#5e5c80', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Remarks</p>
              <p style={{ fontSize: 15, color: '#9896b8', lineHeight: 1.6 }}>{qrData.remarks}</p>
            </div>
          )}

          {/* Company / Uploader */}
          {(qrData?.companyName || qrData?.uploaderName) && (
            <div style={{ display: 'flex', gap: 16 }}>
              {qrData.companyName && (
                <div style={{ flex: 1, background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 20 }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#5e5c80', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Company</p>
                  <p style={{ fontSize: 15, color: '#f0eeff', fontWeight: 500 }}>{qrData.companyName}</p>
                </div>
              )}
              {qrData.uploaderName && (
                <div style={{ flex: 1, background: '#0d0f1a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 20 }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#5e5c80', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Inspector</p>
                  <p style={{ fontSize: 15, color: '#f0eeff', fontWeight: 500 }}>{qrData.uploaderName}</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* File actions - Sticky Bottom for one-handed usage */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'linear-gradient(to top, #07080f 80%, transparent)',
        padding: '32px 24px 24px 24px',
        display: 'flex', justifyContent: 'center',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 440 }}>
          {qrData?.fileUrl ? (
            <>
              <button
                onClick={handlePreview}
                style={{
                  width: '100%', padding: '18px',
                  background: '#6c63ff', color: 'white',
                  border: 'none', borderRadius: 16,
                  fontSize: 16, fontWeight: 600,
                  fontFamily: 'Geist, sans-serif', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  boxShadow: '0 8px 24px rgba(108,99,255,0.25)',
                  minHeight: 56
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Preview Report
              </button>
              
              <a
                href={qrData.downloadUrl || qrData.fileUrl}
                download={qrData.fileName}
                style={{
                  width: '100%', padding: '18px',
                  background: 'transparent', color: '#f0eeff',
                  border: '1.5px solid rgba(255,255,255,0.15)', borderRadius: 16,
                  fontSize: 16, fontWeight: 600,
                  fontFamily: 'Geist, sans-serif', textDecoration: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  minHeight: 56
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download ({qrData.fileSize ? (qrData.fileSize / 1024 / 1024).toFixed(1) + ' MB' : 'File'})
              </a>
            </>
          ) : (
            <button disabled style={{
              width: '100%', padding: '18px',
              background: '#1a1a2e', color: '#5e5c80',
              border: 'none', borderRadius: 16,
              fontSize: 16, fontWeight: 600,
              fontFamily: 'Geist, sans-serif', cursor: 'not-allowed',
              minHeight: 56
            }}>
              Loading file...
            </button>
          )}
        </div>
      </div>
      
      {/* Footer spacer */}
      <div style={{ height: 160 }} />
      
      <div style={{
        position: 'absolute', bottom: 130, width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
      }}>
        <p style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#5e5c80',
          textAlign: 'center', letterSpacing: '0.05em'
        }}>
          Protected by Retriqo
        </p>
        <a href="/" target="_blank" rel="noopener noreferrer" style={{
          fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6c63ff',
          textDecoration: 'none', fontWeight: 500
        }}>
          Learn More
        </a>
      </div>

    </div>
  )
}
