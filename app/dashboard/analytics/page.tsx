'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import MetricCard from '@/components/dashboard/MetricCard'
import ScanChart from '@/components/analytics/ScanChart'
import { IconDeviceDesktop, IconDeviceMobile, IconCheck, IconX, IconActivity } from '@tabler/icons-react'

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({ totalScans: 0, uniqueDevices: 0, blockedAttempts: 0, activeQRs: 0 })
  const [chartData, setChartData] = useState<{ date: string; scans: number }[]>([])
  const [topAssets, setTopAssets] = useState<{ name: string; scans: number }[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [eventsPage, setEventsPage] = useState(0)
  const [hasMoreEvents, setHasMoreEvents] = useState(true)
  const PAGE_SIZE = 20

  useEffect(() => { loadAnalytics() }, [])

  async function loadAnalytics() {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get user's QR codes
    const { data: qrs } = await supabase
      .from('qr_codes')
      .select('id, is_active, qr_unique_id, files(file_name, reports(projects(machine_name)))')
      .eq('user_id', user.id)

    const qrIds = qrs?.map(q => q.id) || []
    const activeQRs = qrs?.filter(q => q.is_active).length || 0

    if (qrIds.length === 0) {
      setLoading(false)
      return
    }

    // Fetch all scan logs
    const { data: logs } = await supabase
      .from('scan_logs')
      .select('*')
      .in('qr_id', qrIds)
      .order('scanned_at', { ascending: false })

    const totalScans = logs?.filter(l => !l.was_blocked).length || 0
    const blocked = logs?.filter(l => l.was_blocked).length || 0
    const uniqueDevices = new Set(logs?.map(l => l.ip_address)).size

    // Build 14-day chart
    const last14 = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const dayStr = d.toISOString().split('T')[0]
      const count = logs?.filter(l => l.scanned_at?.startsWith(dayStr) && !l.was_blocked).length || 0
      last14.push({ date: dateStr, scans: count })
    }

    // Top scanned assets
    const scansByQR = new Map<string, number>()
    logs?.filter(l => !l.was_blocked).forEach(l => {
      scansByQR.set(l.qr_id, (scansByQR.get(l.qr_id) || 0) + 1)
    })
    const top = qrs?.map(q => ({
      name: (q.files as any)?.reports?.projects?.machine_name || 'Unknown',
      qrId: q.id,
      scans: scansByQR.get(q.id) || 0,
    }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 5) || []

    setMetrics({ totalScans, uniqueDevices, blockedAttempts: blocked, activeQRs })
    setChartData(last14)
    setTopAssets(top)
    setEvents(logs?.slice(0, PAGE_SIZE) || [])
    setHasMoreEvents((logs?.length || 0) > PAGE_SIZE)
    setEventsPage(1)
    setLoading(false)
  }

  function loadMoreEvents() {
    // In a real scenario would use cursor-based pagination
    setEventsPage(p => p + 1)
  }

  const maxScans = Math.max(...topAssets.map(a => a.scans), 1)

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-geist" style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 4 }}>Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Monitor scan activity and access patterns across all your QR codes</p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <MetricCard label="Total Scans" value={metrics.totalScans} loading={loading} />
        <MetricCard label="Unique Devices" value={metrics.uniqueDevices} loading={loading} />
        <MetricCard label="Blocked Attempts" value={metrics.blockedAttempts} color="danger" loading={loading} />
        <MetricCard label="Active QR Codes" value={metrics.activeQRs} color="success" loading={loading} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 32 }}>
        {/* Chart */}
        <div className="card" style={{ padding: 24, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <h2 className="font-geist" style={{ fontSize: '1rem', fontWeight: 600 }}>Daily Scan Volume</h2>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last 14 days</span>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: 240, borderRadius: 8 }} />
          ) : (
            <ScanChart data={chartData} />
          )}
        </div>

        {/* Top assets */}
        <div className="card" style={{ padding: 24 }}>
          <h2 className="font-geist" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 20 }}>Top Scanned Assets</h2>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 40 }} />)}
            </div>
          ) : topAssets.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No scans recorded yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topAssets.map((asset, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {asset.name}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                      {asset.scans}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-hover)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      background: 'var(--accent)',
                      borderRadius: 2,
                      width: `${(asset.scans / maxScans) * 100}%`,
                      transition: 'width 600ms ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent events */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <IconActivity size={16} color="var(--accent-light)" />
            <h2 className="font-geist" style={{ fontSize: '1rem', fontWeight: 600 }}>Recent Access Events</h2>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48 }} />)}
            </div>
          ) : events.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No events yet</p>
          ) : (
            <div className="event-feed" style={{ maxHeight: 340, overflowY: 'auto' }}>
              {events.slice(0, eventsPage * PAGE_SIZE).map((event, i) => (
                <div key={i} className="event-item">
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: event.was_blocked ? 'rgba(255,90,90,0.1)' : 'rgba(61,255,160,0.1)',
                    border: `1px solid ${event.was_blocked ? 'rgba(255,90,90,0.2)' : 'rgba(61,255,160,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {event.was_blocked
                      ? <IconX size={14} color="var(--danger)" />
                      : <IconCheck size={14} color="var(--success)" />
                    }
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.was_blocked ? (
                        <span style={{ color: 'var(--danger)' }}>Blocked: </span>
                      ) : null}
                      {event.device_type} · {event.ip_address}
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(event.scanned_at).toLocaleString()}
                      {event.block_reason ? ` · ${event.block_reason}` : ''}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {event.device_type === 'mobile'
                      ? <IconDeviceMobile size={14} color="var(--text-muted)" />
                      : <IconDeviceDesktop size={14} color="var(--text-muted)" />
                    }
                  </div>
                </div>
              ))}
              {hasMoreEvents && (
                <button
                  onClick={loadMoreEvents}
                  style={{ 
                    width: '100%', padding: '10px', textAlign: 'center',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--accent-light)', fontSize: '0.8125rem',
                    fontFamily: 'JetBrains Mono, monospace', marginTop: 8
                  }}
                >
                  Load more events
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
