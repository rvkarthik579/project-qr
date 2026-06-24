import Link from 'next/link';

export default function PrivacyPage() {
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
        <h1 className="section-title" style={{ marginBottom: '4rem', fontSize: '3rem' }}>Privacy Policy</h1>
        
        <div style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '1.1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 500 }}>Data Collection</h2>
            <p>Retriqo operates on a zero-persistence architecture for routing data. When a QR anchor is scanned, we temporarily process IP addresses and device fingerprints strictly for security verification and rate-limiting. This metadata is volatile and is not stored permanently.</p>
          </section>
          
          <section>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 500 }}>File Storage</h2>
            <p>Documents uploaded to the system are encrypted at rest using AES-256-GCM. We cannot read, analyze, or process the contents of your documents. File metadata is decoupled from the physical assets they describe.</p>
          </section>
          
          <section>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 500 }}>Analytics & Tracking</h2>
            <p>Scan analytics are provided strictly to the account owner who generated the QR anchor. We do not use third-party tracking pixels, marketing trackers, or behavior profiling systems within the application environment.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
