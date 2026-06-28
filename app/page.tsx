'use client'
import retriqoLogo from '@/public/retriqo-logo.svg';
import Image from 'next/image';

import Link from 'next/link'
import { useState, useEffect } from 'react'
import RoutingCanvas from '@/components/ui/RoutingCanvas'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    const elements = document.querySelectorAll('.reveal-up')
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing-premium">
      <RoutingCanvas />

      <nav className={`premium-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="premium-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <Image src={retriqoLogo} alt="Retriqo" style={{ height: '28px' , width: 'auto'}} priority unoptimized />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500, marginRight: '0.5rem' }}>Sign In</Link>
          <Link href="/register" className="premium-btn premium-btn-primary">Get Started</Link>
        </div>
      </nav>

      <div className="premium-container">
        
        {/* HERO SECTION */}
        <section className="premium-hero">
          <h1>End manual record-keeping.</h1>
          <p className="hero-subtitle reveal-up delay-1">
            Secure, time-locked asset documentation routed directly to the factory floor.<br/>
            Scan once. Retrieve forever.
          </p>
          <div className="reveal-up delay-2" style={{ marginBottom: '2rem' }}>
            <Link href="/register" className="premium-btn premium-btn-primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>Get Started</Link>
          </div>
          <div className="reveal-up delay-3" style={{ fontSize: '0.75rem', color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
            Designed for Manufacturing • Energy • Logistics • Defense
          </div>

          {/* VISUAL SCHEMATIC */}
          <div className="hero-schematic reveal-up delay-4" style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className="sch-node mono">
              <div className="sch-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              Upload Report
            </div>
            <div className="sch-arrow mono">➔</div>
            <div className="sch-node mono">
              <div className="sch-icon" style={{ borderColor: 'var(--border-active)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/></svg>
              </div>
              Generate QR
            </div>
            <div className="sch-arrow mono">➔</div>
            <div className="sch-node mono">
              <div className="sch-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
              </div>
              Attach to Machine
            </div>
            <div className="sch-arrow mono">➔</div>
            <div className="sch-node mono">
              <div className="sch-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5c0-1.1.9-2 2-2h2"/><path d="M17 3h2c1.1 0 2 .9 2 2v2"/><path d="M21 17v2c0 1.1-.9 2-2 2h-2"/><path d="M7 21H5c-1.1 0-2-.9-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
              </div>
              Scan Anytime
            </div>
            <div className="sch-arrow mono">➔</div>
            <div className="sch-node mono">
              <div className="sch-icon" style={{ color: 'var(--text-main)', borderColor: 'var(--border-active)', background: 'rgba(255,255,255,0.03)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              Instant Access
            </div>
          </div>
        </section>

        {/* WHY IT MATTERS (Core Values) */}
        <section className="premium-section">
          <div className="section-header reveal-up">
            <div className="section-tag mono">{'// Capabilities'}</div>
            <h2 className="section-title">Built for field security.</h2>
          </div>
          
          <div className="value-grid">
            <div className="value-card reveal-up" style={{ transitionDelay: '0.1s' }}>
              <div className="value-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <h3>Time-locked Execution</h3>
              <p>Every QR is bound to a cryptographic timestamp. Scanning after the designated expiry returns a dead end. Zero data persistence.</p>
            </div>
            
            <div className="value-card reveal-up" style={{ transitionDelay: '0.2s' }}>
              <div className="value-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h3>PIN-Gated Access</h3>
              <p>Apply an optional 4-digit PIN layer to critical documents. Three incorrect attempts immediately invalidates the routing link globally.</p>
            </div>
            
            <div className="value-card reveal-up" style={{ transitionDelay: '0.3s' }}>
              <div className="value-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
              </div>
              <h3>Scan Analytics</h3>
              <p>Monitor exact routing paths. See exactly who scanned, when the file was accessed, device type, and geographical location.</p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS (Workflow Timeline) */}
        <section className="premium-section">
          <div className="section-header reveal-up">
            <div className="section-tag mono">{'// Workflow'}</div>
            <h2 className="section-title">Deployment Process.</h2>
          </div>

          <div className="workflow-list">
            {[
              { title: 'Create Project', desc: 'Initialize the machine profile, set location parameters and equipment type. Deploys in 30 seconds.' },
              { title: 'Upload Report', desc: 'Ingest any format — ZIP, PDF, DOCX. The system securely expands ZIP archives automatically.' },
              { title: 'Generate QR', desc: 'Configure expiry rules, attach PIN protection, and generate a cryptographically signed QR anchor.' },
              { title: 'Deploy on Machine', desc: 'Print and attach the QR anchor to the physical asset. Authorized personnel scan for instant retrieval.' }
            ].map((step, i) => (
              <div key={i} className="workflow-item reveal-up" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="wf-number mono">0{i+1}</div>
                <div className="wf-content">
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* WHY IS IT SECURE (Terminal Readout) */}
        <section className="premium-section">
          <div className="section-header reveal-up">
            <div className="section-tag mono">{'// Architecture'}</div>
            <h2 className="section-title">Security Architecture.</h2>
          </div>

          <div className="security-terminal reveal-up">
            <div className="term-line">
              <div className="term-key">ENCRYPTION_STANDARD</div>
              <div className="term-val">AES-256-GCM / 4096-bit RSA</div>
            </div>
            <div className="term-line">
              <div className="term-key">DATA_AT_REST</div>
              <div className="term-val">Encrypted S3 Object Storage (SOC 2 Type II)</div>
            </div>
            <div className="term-line">
              <div className="term-key">REVOCATION_LATENCY</div>
              <div className="term-val">&lt; 50ms globally distributed propagation</div>
            </div>
            <div className="term-line">
              <div className="term-key">FILE_LIMITS</div>
              <div className="term-val">50MB per node. Formats: .pdf, .docx, .zip, .rar</div>
            </div>
            <div className="term-line">
              <div className="term-key">OFFLINE_CACHE</div>
              <div className="term-val">True. Encrypted IndexedDB blob after initial handshake</div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="premium-section" style={{ textAlign: 'center', paddingBottom: '160px' }}>
          <div className="reveal-up">
            <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Replace paper with permanence.</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
              Create an account to begin attaching reports to physical assets.
            </p>
            <Link href="/register" className="premium-btn premium-btn-primary" style={{ padding: '1rem 2rem', fontSize: '1rem' }}>
              Create Account
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ 
          padding: '2rem 0', 
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>
            © 2026 Retriqo
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/privacy" style={{ color: 'var(--text-faint)', fontSize: '0.85rem', textDecoration: 'none' }}>Privacy</Link>
            <Link href="/terms" style={{ color: 'var(--text-faint)', fontSize: '0.85rem', textDecoration: 'none' }}>Terms</Link>
            <Link href="/security" style={{ color: 'var(--text-faint)', fontSize: '0.85rem', textDecoration: 'none' }}>Security</Link>
          </div>
        </footer>

      </div>
    </div>
  )
}
