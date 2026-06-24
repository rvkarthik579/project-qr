import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="landing-premium" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="premium-nav" style={{ position: 'relative', background: 'transparent' }}>
        <div className="premium-logo">
          <Link href="/" className="premium-logo" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/retriqo-logo.svg" alt="Retriqo" style={{ height: '28px' }} />
          </Link>
        </div>
      </nav>
      
      <main className="premium-container" style={{ flex: 1, padding: '120px 5vw', maxWidth: '800px' }}>
        <div className="section-tag mono" style={{ marginBottom: '2rem' }}>{'// Legal'}</div>
        <h1 className="section-title" style={{ marginBottom: '4rem', fontSize: '3rem' }}>Terms of Service</h1>
        
        <div style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '1.1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 500 }}>System Usage</h2>
            <p>Retriqo is provided as industrial infrastructure. Users are strictly prohibited from utilizing the routing network to distribute malicious payloads, illegal documentation, or any data that violates international compliance standards. Accounts found in violation will be immediately terminated without recovery options.</p>
          </section>
          
          <section>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 500 }}>Uptime & Reliability</h2>
            <p>While we target 99.99% uptime for the core routing engine, Retriqo is not liable for production delays, lost assets, or secondary damages resulting from temporary network unavailability. We recommend configuring offline fallbacks for mission-critical deployments.</p>
          </section>
          
          <section>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 500 }}>Hardware Anchors</h2>
            <p>Users are responsible for the physical security of printed QR anchors. Retriqo cannot differentiate between an authorized scan and an unauthorized scan if the physical anchor is compromised, unless PIN-gated access is explicitly configured prior to deployment.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
