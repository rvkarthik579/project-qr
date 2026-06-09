'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{
      background: '#07080f',
      minHeight: '100vh',
      color: '#f0eeff',
      fontFamily: 'Inter, sans-serif',
      overflowX: 'hidden'
    }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 48px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(7,8,15,0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition: 'all 300ms ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: '#6c63ff',
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <rect x="1" y="1" width="6" height="6"/>
              <rect x="9" y="1" width="6" height="6"/>
              <rect x="1" y="9" width="6" height="6"/>
              <rect x="11" y="11" width="4" height="4"/>
              <rect x="9" y="9" width="2" height="2"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'Geist, sans-serif',
            fontWeight: 700, fontSize: 17
          }}>Project QR</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <a href="#how-it-works" style={{ color: '#9896b8', textDecoration: 'none', fontSize: 14, transition: 'color 150ms' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#f0eeff'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#9896b8'}>
            How it works
          </a>
          <a href="#features" style={{ color: '#9896b8', textDecoration: 'none', fontSize: 14, transition: 'color 150ms' }}
            onMouseEnter={e => (e.target as HTMLElement).style.color = '#f0eeff'}
            onMouseLeave={e => (e.target as HTMLElement).style.color = '#9896b8'}>
            Features
          </a>
          <Link href="/login" style={{ color: '#9896b8', textDecoration: 'none', fontSize: 14 }}>
            Sign In
          </Link>
          <Link href="/register" style={{
            background: '#6c63ff', color: 'white',
            padding: '8px 18px', borderRadius: 6,
            fontSize: 14, fontWeight: 500, textDecoration: 'none',
            transition: 'background 150ms ease'
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 40px 80px',
        position: 'relative',
        backgroundImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(108,99,255,0.15) 0%, transparent 70%)'
      }}>
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(108,99,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)'
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(108,99,255,0.08)',
          border: '1px solid rgba(108,99,255,0.2)',
          borderRadius: 20, padding: '6px 16px', marginBottom: 32,
          position: 'relative'
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#a89cff', boxShadow: '0 0 6px #a89cff'
          }} />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#a89cff',
            letterSpacing: '0.1em', textTransform: 'uppercase'
          }}>
            Industrial Asset Management
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: 'clamp(48px, 8vw, 96px)',
          fontWeight: 800,
          lineHeight: 1.0,
          letterSpacing: '-0.03em',
          marginBottom: 24,
          position: 'relative'
        }}>
          Industrial reports.<br/>
          <span style={{ color: '#a89cff' }}>Zero paper.</span><br/>
          <span style={{ color: '#f0c060' }}>Instant access.</span>
        </h1>

        {/* Subheading */}
        <p style={{
          fontSize: 18, color: '#9896b8',
          maxWidth: 520, lineHeight: 1.7,
          marginBottom: 16, fontWeight: 300,
          position: 'relative'
        }}>
          Replace paper inspection reports with QR-linked digital records.
          Stick a code on any machine — anyone can scan it to access
          the exact report, forever.
        </p>

        {/* Social proof */}
        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: '#5e5c80',
          letterSpacing: '0.1em', marginBottom: 48,
          textTransform: 'uppercase', position: 'relative'
        }}>
          Used in 12+ industrial facilities · Zero breaches
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', gap: 14, alignItems: 'center',
          justifyContent: 'center', flexWrap: 'wrap',
          marginBottom: 80, position: 'relative'
        }}>
          <Link href="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#6c63ff', color: 'white',
            padding: '15px 32px', borderRadius: 6,
            fontSize: 15, fontWeight: 500, textDecoration: 'none',
            boxShadow: '0 0 32px rgba(108,99,255,0.35)',
            transition: 'all 150ms ease'
          }}>
            Get Started Free →
          </Link>
          <a href="#how-it-works" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'transparent', color: '#9896b8',
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '14px 28px', borderRadius: 6,
            fontSize: 15, textDecoration: 'none',
            transition: 'all 150ms ease'
          }}>
            See how it works ↓
          </a>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 0, alignItems: 'center',
          justifyContent: 'center', position: 'relative'
        }}>
          {[
            { num: '∞', label: 'QR Generated' },
            { num: '100%', label: 'Encrypted' },
            { num: '<200ms', label: 'Decode time' },
            { num: '0', label: 'Breaches' }
          ].map((stat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.07)', margin: '0 40px' }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'Geist, sans-serif',
                  fontSize: 28, fontWeight: 700
                }}>{stat.num}</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10, color: '#5e5c80',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  marginTop: 4
                }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST BAR */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '18px 40px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 48, flexWrap: 'wrap',
        background: '#0d0f1a'
      }}>
        {['AES-256 Encrypted', 'SOC 2 Type II', 'Auto-invalidation', 'PIN Protection', 'ISO 27001'].map(item => (
          <div key={item} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#5e5c80',
            letterSpacing: '0.06em'
          }}>
            <span style={{ color: '#3dffa0', fontSize: 10 }}>✓</span>
            {item}
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: '120px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 64 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#a89cff',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 16
          }}>// How it works</div>
          <h2 style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 700, letterSpacing: '-0.02em',
            lineHeight: 1.1, marginBottom: 16
          }}>
            Four steps.<br/>Zero compromise.
          </h2>
          <p style={{ color: '#9896b8', fontSize: 16, maxWidth: 480, lineHeight: 1.7, fontWeight: 300 }}>
            From first inspection to field distribution in under 60 seconds.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, overflow: 'hidden'
        }}>
          {[
            { num: '01', title: 'Create Project', desc: 'Name the machine, set location and type. Takes 30 seconds.' },
            { num: '02', title: 'Upload Report', desc: 'Upload any file — ZIP, PDF, DOCX. We expand ZIP folders automatically.' },
            { num: '03', title: 'Generate QR', desc: 'Set expiry, add PIN protection, generate a signed QR code instantly.' },
            { num: '04', title: 'Stick on Machine', desc: 'Print and stick the QR on the machine. Anyone scans to access the report.' }
          ].map((step, i) => (
            <div key={i} style={{
              background: '#0d0f1a', padding: '40px 32px',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              transition: 'background 200ms ease'
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#12152b'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#0d0f1a'}
            >
              <div style={{
                fontFamily: 'Geist, sans-serif',
                fontSize: 64, fontWeight: 800,
                color: 'rgba(255,255,255,0.04)',
                lineHeight: 1, marginBottom: 20
              }}>{step.num}</div>
              <div style={{
                fontFamily: 'Geist, sans-serif',
                fontSize: 16, fontWeight: 600, marginBottom: 12
              }}>{step.title}</div>
              <div style={{ fontSize: 13, color: '#9896b8', lineHeight: 1.7 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{
        padding: '0 40px 120px',
        maxWidth: 1200, margin: '0 auto'
      }}>
        <div style={{ marginBottom: 64 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#a89cff',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 16
          }}>// Core capabilities</div>
          <h2 style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 700, letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}>
            Built for<br/>field security.
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 2,
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 12, overflow: 'hidden'
        }}>
          {[
            { title: 'Time-locked QR Codes', desc: 'Every QR is bound to a cryptographic timestamp. Scanning after expiry returns nothing.' },
            { title: 'PIN-Gated Access', desc: 'Optional 4-digit PIN layer. Three wrong attempts triggers full asset revocation.' },
            { title: 'Scan Analytics', desc: 'See exactly who scanned, when, IP address, device type, and location.' },
            { title: 'Multi-format Support', desc: 'ZIP, EAR, WAR, RAR, PDF, DOCX — up to 50MB. AES-256 applied to all.' },
            { title: 'Instant Revocation', desc: 'One click kills a QR globally — mid-scan. Compromised codes gone in seconds.' },
            { title: 'Offline Support', desc: 'Files cached after first scan. Works deep in factories with zero signal.' }
          ].map((feature, i) => (
            <div key={i} style={{
              background: '#0d0f1a', padding: '32px',
              position: 'relative', transition: 'background 200ms ease',
              borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none'
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#12152b'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = '#0d0f1a'
              }}
            >
              <div style={{
                width: 40, height: 40,
                background: 'rgba(108,99,255,0.1)',
                border: '1px solid rgba(108,99,255,0.2)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12, color: '#a89cff'
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{
                fontFamily: 'Geist, sans-serif',
                fontSize: 15, fontWeight: 600, marginBottom: 10
              }}>{feature.title}</div>
              <div style={{ fontSize: 13, color: '#9896b8', lineHeight: 1.7 }}>{feature.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FREE CTA SECTION — NO PRICING */}
      <section style={{
        padding: '120px 40px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(108,99,255,0.08) 0%, transparent 70%)'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(61,255,160,0.08)',
          border: '1px solid rgba(61,255,160,0.2)',
          borderRadius: 20, padding: '6px 16px', marginBottom: 32
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#3dffa0', boxShadow: '0 0 8px #3dffa0'
          }} />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
            color: '#3dffa0', letterSpacing: '0.08em', textTransform: 'uppercase'
          }}>
            100% Free — No credit card required
          </span>
        </div>

        <h2 style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: 'clamp(36px, 5vw, 64px)',
          fontWeight: 700, letterSpacing: '-0.02em',
          lineHeight: 1.1, marginBottom: 16
        }}>
          Start for free.<br/>Forever.
        </h2>

        <p style={{
          color: '#9896b8', fontSize: 17,
          maxWidth: 480, margin: '0 auto 48px',
          lineHeight: 1.7, fontWeight: 300
        }}>
          No plans. No tiers. No hidden costs. Project QR is completely
          free while we build alongside our early users.
        </p>

        <Link href="/register" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#6c63ff', color: 'white',
          padding: '16px 40px', borderRadius: 6,
          fontSize: 15, fontWeight: 500, textDecoration: 'none',
          boxShadow: '0 0 32px rgba(108,99,255,0.35)',
          marginBottom: 48
        }}>
          Get Started Free →
        </Link>

        <div style={{
          display: 'flex', gap: 32, justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {['Unlimited projects', 'Unlimited QR codes', 'Full analytics',
            'PIN protection', 'Offline support'].map(feature => (
            <div key={feature} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, color: '#9896b8'
            }}>
              <span style={{ color: '#3dffa0' }}>✓</span>
              {feature}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '32px 48px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: '#5e5c80'
        }}>
          © 2026 Project QR — Industrial Asset Distribution
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Security', 'Docs'].map(link => (
            <a key={link} href="#" style={{
              fontSize: 12, color: '#5e5c80',
              textDecoration: 'none', transition: 'color 150ms'
            }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#9896b8'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#5e5c80'}
            >{link}</a>
          ))}
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: '#5e5c80'
        }}>
          AES-256 Encrypted · SOC 2 Compliant
        </div>
      </footer>

    </div>
  )
}
