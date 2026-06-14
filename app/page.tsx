'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

// Particle system
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number;
    }[] = []
    
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.1
      })
    }
    
    let animId: number
    function animate() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(165,180,252,${p.opacity})`
        ctx.fill()
      })
      
      animId = requestAnimationFrame(animate)
    }
    animate()
    
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    
    // Scroll reveal
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible')
      }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    )
    document.querySelectorAll('.reveal, .reveal-up, .reveal-scale')
      .forEach(el => observer.observe(el))
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      observer.disconnect()
    }
  }, [])

  return (
    <div style={{
      background: '#080c14',
      minHeight: '100vh',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      <Particles />

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 48px', height: 64,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        background: scrolled
          ? 'rgba(8,12,20,0.85)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(148,163,184,0.08)'
          : 'none',
        transition: 'all 400ms ease'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 10, position: 'relative', zIndex: 1
        }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            borderRadius: 9,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99,102,241,0.4)'
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <rect x="1" y="1" width="6" height="6" rx="1"/>
              <rect x="9" y="1" width="6" height="6" rx="1"/>
              <rect x="1" y="9" width="6" height="6" rx="1"/>
              <rect x="11" y="11" width="4" height="4" rx="0.5"/>
              <rect x="9" y="9" width="2" height="2" rx="0.3"/>
            </svg>
          </div>
          <span style={{
            fontFamily: 'Geist, sans-serif',
            fontWeight: 700, fontSize: 17,
            letterSpacing: '-0.01em'
          }}>Project QR</span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center',
          gap: 36, position: 'relative', zIndex: 1
        }}>
          {['How it works', 'Features'].map(item => (
            <a key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              style={{
                color: '#94a3b8', textDecoration: 'none',
                fontSize: 14, fontWeight: 400,
                transition: 'color 150ms ease'
              }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#f8fafc'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#94a3b8'}
            >{item}</a>
          ))}
          <Link href="/login" style={{
            color: '#94a3b8', textDecoration: 'none',
            fontSize: 14, transition: 'color 150ms'
          }}>Sign In</Link>
          <Link href="/register" style={{
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            color: 'white', padding: '8px 20px',
            borderRadius: 7, fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
            boxShadow: '0 0 20px rgba(99,102,241,0.3)',
            transition: 'all 200ms ease'
          }}>Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        padding: '140px 40px 100px',
        position: 'relative', zIndex: 1
      }}>
        {/* Glow orb behind hero */}
        <div style={{
          position: 'absolute',
          width: 600, height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none'
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 20, padding: '6px 16px',
          marginBottom: 40
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#818cf8',
            boxShadow: '0 0 8px #818cf8'
          }} />
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#818cf8',
            letterSpacing: '0.1em', textTransform: 'uppercase'
          }}>Industrial Asset Management</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'Geist, sans-serif',
          fontSize: 'clamp(48px, 8vw, 96px)',
          fontWeight: 800, lineHeight: 1.0,
          letterSpacing: '-0.03em',
          marginBottom: 28
        }}>
          Industrial reports.<br/>
          <span style={{
            background: 'linear-gradient(135deg, #818cf8, #6366f1, #a5b4fc)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'gradientShift 4s ease infinite'
          }}>Zero paper.</span><br/>
          <span style={{ color: '#fbbf24' }}>Instant access.</span>
        </h1>

        <p style={{
          fontSize: 18, color: '#94a3b8',
          maxWidth: 520, lineHeight: 1.7,
          marginBottom: 16, fontWeight: 300
        }}>
          Replace paper inspection reports with QR-linked digital records.
          Stick a code on any machine — anyone can scan it to access
          the exact report, forever.
        </p>

        <p style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: '#475569',
          letterSpacing: '0.1em', marginBottom: 48,
          textTransform: 'uppercase'
        }}>
          Used in 12+ industrial facilities · Zero breaches
        </p>

        <div style={{
          display: 'flex', gap: 14,
          alignItems: 'center', justifyContent: 'center',
          flexWrap: 'wrap', marginBottom: 96
        }}>
          <Link href="/register" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            color: 'white', padding: '15px 36px',
            borderRadius: 8, fontSize: 15, fontWeight: 600,
            textDecoration: 'none',
            boxShadow: '0 0 40px rgba(99,102,241,0.4)',
            fontFamily: 'Geist, sans-serif',
            transition: 'all 200ms ease'
          }}>
            Get Started Free →
          </Link>
          <a href="#how-it-works" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(148,163,184,0.06)',
            color: '#94a3b8',
            border: '1px solid rgba(148,163,184,0.12)',
            padding: '14px 28px', borderRadius: 8,
            fontSize: 15, textDecoration: 'none',
            transition: 'all 150ms ease'
          }}
            onClick={e => {
              e.preventDefault()
              document.getElementById('how-it-works')
                ?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            See how it works ↓
          </a>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex', gap: 0,
          alignItems: 'center', justifyContent: 'center'
        }}>
          {[
            { num: '∞', label: 'QR Generated' },
            { num: '100%', label: 'Encrypted' },
            { num: '<200ms', label: 'Decode time' },
            { num: '0', label: 'Breaches' }
          ].map((stat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <div style={{
                width: 1, height: 40,
                background: 'rgba(148,163,184,0.1)',
                margin: '0 40px'
              }} />}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'Geist, sans-serif',
                  fontSize: 28, fontWeight: 700, color: '#f8fafc'
                }}>{stat.num}</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 10, color: '#475569',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase', marginTop: 4
                }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST BAR */}
      <div style={{
        borderTop: '1px solid rgba(148,163,184,0.08)',
        borderBottom: '1px solid rgba(148,163,184,0.08)',
        padding: '18px 40px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 48,
        flexWrap: 'wrap',
        background: 'rgba(13,18,32,0.8)',
        backdropFilter: 'blur(10px)',
        position: 'relative', zIndex: 1
      }}>
        {['AES-256 Encrypted', 'SOC 2 Type II',
          'Auto-invalidation', 'PIN Protection', 'ISO 27001'].map(item => (
          <div key={item} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#475569',
            letterSpacing: '0.06em'
          }}>
            <span style={{ color: '#34d399', fontSize: 10 }}>✓</span>
            {item}
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{
        padding: '120px 40px',
        maxWidth: 1200, margin: '0 auto',
        position: 'relative', zIndex: 1
      }}>
        <div className="reveal-up" style={{ marginBottom: 72 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#818cf8',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 16
          }}>{"// The Protocol"}</div>
          <h2 style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 700, letterSpacing: '-0.02em',
            lineHeight: 1.1, marginBottom: 16
          }}>Deploy in seconds.</h2>
          <p style={{
            color: '#94a3b8', fontSize: 16,
            maxWidth: 480, lineHeight: 1.7, fontWeight: 300
          }}>
            From first inspection to field distribution in under 60 seconds.
            No training required.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 2,
          border: '1px solid rgba(148,163,184,0.08)',
          borderRadius: 16, overflow: 'hidden'
        }}>
          {[
            {
              num: '01',
              title: 'Create Project',
              desc: 'Initialize a secure digital silo for your machine or facility. Name it, locate it, categorize it.'
            },
            {
              num: '02',
              title: 'Upload Data',
              desc: 'Drop PDFs, schematics, ZIP archives, and maintenance logs into the vault. We expand everything automatically.'
            },
            {
              num: '03',
              title: 'Generate QR',
              desc: 'Instantly create a dynamic, AES-256 encrypted, high-contrast QR code with expiry and PIN protection.'
            },
            {
              num: '04',
              title: 'Stick & Scan',
              desc: 'Affix to the hardware. Any technician with clearance can scan instantly — online or offline.'
            }
          ].map((step, i) => (
            <div
              key={i}
              className="reveal-scale"
              style={{
                background: '#0d1220',
                padding: '40px 32px',
                transition: 'background 200ms ease',
                animationDelay: `${i * 100}ms`
              }}
              onMouseEnter={e =>
                (e.currentTarget as HTMLElement).style.background = '#111827'
              }
              onMouseLeave={e =>
                (e.currentTarget as HTMLElement).style.background = '#0d1220'
              }
            >
              <div style={{
                fontFamily: 'Geist, sans-serif',
                fontSize: 72, fontWeight: 800,
                color: 'rgba(148,163,184,0.06)',
                lineHeight: 1, marginBottom: 24
              }}>{step.num}</div>
              <div style={{
                fontFamily: 'Geist, sans-serif',
                fontSize: 16, fontWeight: 600,
                marginBottom: 12, color: '#f8fafc'
              }}>{step.title}</div>
              <div style={{
                fontSize: 13, color: '#94a3b8',
                lineHeight: 1.7
              }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{
        padding: '0 40px 120px',
        maxWidth: 1200, margin: '0 auto',
        position: 'relative', zIndex: 1
      }}>
        <div className="reveal-up" style={{ marginBottom: 72 }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#818cf8',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 16
          }}>{"// Platform Capabilities"}</div>
          <h2 style={{
            fontFamily: 'Geist, sans-serif',
            fontSize: 'clamp(32px, 4vw, 52px)',
            fontWeight: 700, letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}>Engineered for<br/>extreme environments.</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
          border: '1px solid rgba(148,163,184,0.08)',
          borderRadius: 16, overflow: 'hidden'
        }}>
          {[
            {
              title: 'Time-locked QR Codes',
              desc: 'Generate temporary access codes that automatically self-destruct after shift completion.',
              icon: '⏱'
            },
            {
              title: 'PIN-Gated Access',
              desc: 'Force multi-factor authentication before a report is accessed. Configurable per asset.',
              icon: '🔐'
            },
            {
              title: 'Scan Analytics',
              desc: 'Track exactly who accessed what, when, and from where. Full audit trail.',
              icon: '📊'
            },
            {
              title: 'Multi-Format',
              desc: 'Supports PDF, DOCX, ZIP, RAR, WAR, EAR, and 50MB file uploads.',
              icon: '📁'
            },
            {
              title: 'Instant Revocation',
              desc: 'Kill a QR code\'s access instantly from the command dashboard. Useful for contractor close-outs.',
              icon: '🚫'
            },
            {
              title: 'Offline Support',
              desc: 'Assets cached locally for zero-signal environments. Works underground, in server rooms.',
              icon: '📡'
            }
          ].map((feature, i) => (
            <div
              key={i}
              className="reveal-scale"
              style={{
                background: '#0d1220',
                padding: '32px',
                transition: 'background 200ms ease',
                animationDelay: `${i * 80}ms`,
                borderBottom: i < 3
                  ? '1px solid rgba(148,163,184,0.08)'
                  : 'none'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#111827'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = '#0d1220'
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 16 }}>
                {feature.icon}
              </div>
              <div style={{
                fontFamily: 'Geist, sans-serif',
                fontSize: 15, fontWeight: 600,
                marginBottom: 10, color: '#f8fafc'
              }}>{feature.title}</div>
              <div style={{
                fontSize: 13, color: '#94a3b8',
                lineHeight: 1.7
              }}>{feature.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA SECTION — Jupiter style ending */}
      <section style={{
        position: 'relative', zIndex: 1,
        overflow: 'hidden'
      }}>
        {/* Jupiter-style gradient background */}
        <div style={{
          background: 'linear-gradient(180deg, #080c14 0%, #0a0f1e 30%, #0d1424 60%, #0a1628 80%, #080c14 100%)',
          padding: '140px 40px',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Radial glow */}
          <div style={{
            position: 'absolute',
            width: 800, height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)',
            bottom: 0, left: '50%',
            transform: 'translateX(-50%)'
          }} />

          {/* Horizontal line */}
          <div style={{
            width: 1, height: 80,
            background: 'linear-gradient(180deg, transparent, rgba(148,163,184,0.2), transparent)',
            margin: '0 auto 48px'
          }} />

          <div className="reveal-up">
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 20, padding: '6px 16px',
              marginBottom: 32
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#34d399',
                boxShadow: '0 0 8px #34d399',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, color: '#34d399',
                letterSpacing: '0.08em', textTransform: 'uppercase'
              }}>100% Free — No credit card required</span>
            </div>

            <h2 style={{
              fontFamily: 'Geist, sans-serif',
              fontSize: 'clamp(40px, 6vw, 72px)',
              fontWeight: 800, letterSpacing: '-0.03em',
              lineHeight: 1.05, marginBottom: 20,
              color: '#f8fafc'
            }}>
              Start for free.<br/>
              <span style={{
                background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>Forever.</span>
            </h2>

            <p style={{
              color: '#94a3b8', fontSize: 17,
              maxWidth: 480, margin: '0 auto 52px',
              lineHeight: 1.7, fontWeight: 300
            }}>
              No plans. No tiers. No hidden costs.
              Project QR is completely free while we
              build alongside our early users.
            </p>

            <Link href="/register" style={{
              display: 'inline-flex', alignItems: 'center',
              gap: 10,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: 'white', padding: '18px 48px',
              borderRadius: 10, fontSize: 16,
              fontWeight: 600,
              fontFamily: 'Geist, sans-serif',
              textDecoration: 'none',
              boxShadow: '0 0 60px rgba(99,102,241,0.4), 0 20px 40px rgba(99,102,241,0.2)',
              transition: 'all 200ms ease'
            }}>
              Get Started Free →
            </Link>

            <div style={{
              display: 'flex', gap: 32,
              justifyContent: 'center',
              flexWrap: 'wrap', marginTop: 40
            }}>
              {[
                'Unlimited projects',
                'Unlimited QR codes',
                'Full analytics',
                'PIN protection',
                'Offline support'
              ].map(f => (
                <div key={f} style={{
                  display: 'flex', alignItems: 'center',
                  gap: 8, fontSize: 13, color: '#64748b'
                }}>
                  <span style={{ color: '#34d399' }}>✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom line like Jupiter */}
          <div style={{
            width: 1, height: 80,
            background: 'linear-gradient(180deg, rgba(148,163,184,0.2), transparent)',
            margin: '72px auto 0'
          }} />
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(148,163,184,0.08)',
        padding: '28px 48px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16,
        background: '#080c14',
        position: 'relative', zIndex: 1
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: '#334155'
        }}>
          © 2026 Project QR — Industrial Asset Distribution
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Security', 'Docs'].map(link => (
            <a key={link} href="#" style={{
              fontSize: 12, color: '#334155',
              textDecoration: 'none', transition: 'color 150ms'
            }}
              onMouseEnter={e =>
                (e.target as HTMLElement).style.color = '#94a3b8'
              }
              onMouseLeave={e =>
                (e.target as HTMLElement).style.color = '#334155'
              }
            >{link}</a>
          ))}
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: '#334155'
        }}>
          AES-256 · SOC 2 · ISO 27001
        </div>
      </footer>

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .reveal-up {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.8s cubic-bezier(0.16,1,0.3,1),
                      transform 0.8s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-scale {
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 0.6s cubic-bezier(0.16,1,0.3,1),
                      transform 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .reveal-scale.visible {
          opacity: 1;
          transform: scale(1);
        }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  )
}
