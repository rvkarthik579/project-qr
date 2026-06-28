/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useRef, useState, useEffect } from 'react'
import { IconLock } from '@tabler/icons-react'

interface PinEntryProps {
  onSubmit: (pin: string) => void
  error?: boolean
  locked?: boolean
  lockSecondsRemaining?: number
  attemptsLeft?: number
}

export default function PinEntry({ onSubmit, error, locked, lockSecondsRemaining, attemptsLeft }: PinEntryProps) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [shaking, setShaking] = useState(false)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    if (error) {
      setShaking(true)
      setDigits(['', '', '', ''])
      setTimeout(() => {
        setShaking(false)
        inputRefs[0].current?.focus()
      }, 400)
    }
  }, [error])

  useEffect(() => {
    inputRefs[0].current?.focus()
  }, [])

  function handleChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...digits]
    newDigits[index] = digit
    setDigits(newDigits)

    if (digit && index < 3) {
      inputRefs[index + 1].current?.focus()
    }

    if (digit && index === 3) {
      const pin = [...newDigits.slice(0, 3), digit].join('')
      if (pin.length === 4) {
        setTimeout(() => onSubmit(pin), 100)
      }
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    const newDigits = [...pasted.split(''), '', '', '', ''].slice(0, 4)
    setDigits(newDigits)
    if (pasted.length === 4) onSubmit(pasted)
    else inputRefs[Math.min(pasted.length, 3)].current?.focus()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{
        width: 64, height: 64,
        background: 'rgba(108,99,255,0.1)',
        border: '1px solid rgba(108,99,255,0.2)',
        borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <IconLock size={28} color="var(--accent-light)" />
      </div>

      <div style={{ textAlign: 'center' }}>
        <h2 className="font-geist" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>
          PIN Required
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Enter the 4-digit PIN to access this file
        </p>
      </div>

      {locked ? (
        <div style={{
          padding: '20px 24px',
          background: 'rgba(255,90,90,0.08)',
          border: '1px solid rgba(255,90,90,0.2)',
          borderRadius: 12, textAlign: 'center'
        }}>
          <p style={{ color: 'var(--danger)', fontWeight: 500, marginBottom: 4 }}>Access Locked</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {lockSecondsRemaining 
              ? `Try again in ${lockSecondsRemaining} seconds`
              : 'Too many failed attempts. Contact the report owner.'
            }
          </p>
        </div>
      ) : (
        <>
          <div
            className={shaking ? 'animate-shake' : ''}
            style={{ display: 'flex', gap: 12 }}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                type="tel"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={handlePaste}
                className={`pin-input ${error ? 'error' : ''}`}
                disabled={locked}
                autoComplete="off"
              />
            ))}
          </div>

          {error && (
            <div style={{
              padding: '10px 20px',
              background: 'rgba(255,90,90,0.08)',
              border: '1px solid rgba(255,90,90,0.2)',
              borderRadius: 8,
              color: 'var(--danger)',
              fontSize: '0.875rem',
              textAlign: 'center'
            }}>
              Incorrect PIN.{attemptsLeft !== undefined ? ` ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.` : ''}
            </div>
          )}
        </>
      )}
    </div>
  )
}

