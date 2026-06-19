'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import {
  IconArrowLeft, IconUpload, IconAlertTriangle, IconFile,
  IconMapPin, IconCategory, IconCalendar,
  IconClock
} from '@tabler/icons-react'

const statusConfig = {
  pass: { label: 'Pass', color: 'var(--success)', bg: 'rgba(61,255,160,0.1)', border: 'rgba(61,255,160,0.2)' },
  fail: { label: 'Fail', color: 'var(--danger)', bg: 'rgba(255,90,90,0.1)', border: 'rgba(255,90,90,0.2)' },
  needs_attention: { label: 'Needs Attention', color: 'var(--warning)', bg: 'rgba(240,192,96,0.1)', border: 'rgba(240,192,96,0.2)' },
}

function normalizeStatus(s: string): keyof typeof statusConfig {
  const lower = s.toLowerCase().replace(' ', '_')
  if (lower === 'pass') return 'pass'
  if (lower === 'fail') return 'fail'
  return 'needs_attention'
}

interface ReportFile {
  id: string
  file_name: string
  file_path: string
  file_size?: number
  file_type?: string
  qr_codes?: Array<{ id: string; qr_unique_id: string; expiry_date: string | null; is_active: boolean; password_hash?: string }>
}

interface Report {
  id: string
  status: string
  remarks?: string
  next_inspection_date?: string
  created_at: string
  version_number?: number
  files?: ReportFile[]
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const { id: projectId } = params as { id: string }
  const [project, setProject] = useState<Record<string, string> | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [revokeModal, setRevokeModal] = useState(false)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient()
      const { data: proj } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (proj) setProject(proj)

      const { data: reps } = await supabase
        .from('reports')
        .select(`
          id, status, remarks, next_inspection_date, created_at, version_number,
          files(id, file_name, file_path, file_size, file_type,
            qr_codes(id, qr_unique_id, expiry_date, is_active, password_hash)
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (reps) setReports(reps)
      setLoading(false)
    }
    load()
  }, [projectId])

  async function handleRevokeAll() {
    setRevoking(true)
    const supabase = getSupabaseBrowserClient()
    await supabase
      .from('qr_codes')
      .update({ is_active: false })
      .in('report_id', reports.map(r => r.id))
    
    // Optimistically update UI
    setReports(prev => prev.map(report => ({
      ...report,
      files: report.files?.map((file: ReportFile) => ({
        ...file,
        qr_codes: file.qr_codes?.map(qr => ({ ...qr, is_active: false }))
      }))
    })))
    setRevokeModal(false)
    setRevoking(false)
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 20, width: 200, marginBottom: 32 }} />
        <div className="skeleton" style={{ height: 36, width: '60%', marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 40 }} />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card skeleton" style={{ height: 160, marginBottom: 16 }} />
        ))}
      </div>
    )
  }

  if (!project) return (
    <div style={{ textAlign: 'center', padding: 64 }}>
      <h2 className="font-geist" style={{ marginBottom: 8 }}>Project not found</h2>
      <Link href="/dashboard" className="btn btn-secondary" style={{ display: 'inline-flex', marginTop: 16 }}>
        Back to Dashboard
      </Link>
    </div>
  )

  const masterQRUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard/projects/${projectId}`

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Back */}
      <Link href="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', marginBottom: 24 }}>
        <IconArrowLeft size={16} />
        Dashboard
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h1 className="font-geist" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>
            {project.machine_name}
          </h1>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {project.location && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <IconMapPin size={14} />
                {project.location}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <IconCategory size={14} />
              {project.project_type}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              <IconClock size={14} />
              Created {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setRevokeModal(true)}
            className="btn btn-danger btn-sm"
          >
            <IconAlertTriangle size={15} />
            Revoke All QRs
          </button>
          <Link href={`/dashboard/projects/${projectId}/upload`} className="btn btn-primary btn-sm">
            <IconUpload size={15} />
            Upload New Report
          </Link>
        </div>
      </div>

      {/* Master QR */}
      <div className="card" style={{ padding: 24, marginBottom: 32, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ background: 'white', padding: 12, borderRadius: 10 }}>
          <QRCodeSVG value={masterQRUrl} size={100} bgColor="white" fgColor="#07080f" level="M" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Master QR Code</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(61,255,160,0.1)', color: 'var(--success)', border: '1px solid rgba(61,255,160,0.2)' }}>PERMANENT</span>
          </div>
          <h3 className="font-geist" style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
            {project.machine_name}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This QR code links to this project page and never expires. Print and stick it on the machine.
          </p>
        </div>
      </div>

      {/* Reports Timeline */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="font-geist" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Inspection History
          </h2>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '4px 10px', borderRadius: 20 }}>
            {reports.length} report{reports.length !== 1 ? 's' : ''}
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <IconFile size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h3 className="font-geist" style={{ marginBottom: 8 }}>No reports yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Upload your first inspection report to get started</p>
            <Link href={`/dashboard/projects/${projectId}/upload`} className="btn btn-primary" style={{ display: 'inline-flex' }}>
              <IconUpload size={16} />
              Upload First Report
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="stagger-list">
            {reports.map((report, index) => {
              const s = statusConfig[normalizeStatus(report.status)]
              return (
                <div key={report.id} className="card" style={{ padding: 24 }}>
                  {/* Report header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Version {reports.length - index}
                        </span>
                        <span style={{
                          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', fontWeight: 500,
                          padding: '3px 8px', borderRadius: 4,
                          background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                          textTransform: 'uppercase', letterSpacing: '0.05em'
                        }}>
                          {s.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        <IconCalendar size={13} />
                        {new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    {report.next_inspection_date && (
                      <div style={{ 
                        padding: '8px 12px', 
                        background: 'rgba(240,192,96,0.05)', 
                        border: '1px solid rgba(240,192,96,0.15)', 
                        borderRadius: 8,
                        fontSize: '0.8125rem', color: 'var(--warning)'
                      }}>
                        Next inspection: {new Date(report.next_inspection_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Remarks */}
                  {report.remarks && (
                    <div style={{ 
                      padding: '10px 14px',
                      background: 'var(--bg-hover)',
                      borderRadius: 8, borderLeft: `3px solid ${s.color}`,
                      marginBottom: 16, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6
                    }}>
                      {report.remarks}
                    </div>
                  )}

                  {/* Files */}
                  {report.files && report.files.length > 0 && (
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                        Files & QR Codes
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {report.files.map((file: ReportFile) => {
                          const qr = file.qr_codes?.[0]
                          return (
                            <div key={file.id} style={{
                              display: 'flex', alignItems: 'center',
                              padding: '10px 14px',
                              background: 'var(--bg-hover)',
                              borderRadius: 8, flexWrap: 'wrap', gap: 10
                            }}>
                              <IconFile size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file.file_name}
                                </div>
                                {file.file_size && (
                                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {formatFileSize(file.file_size)}
                                  </div>
                                )}
                              </div>
                              {qr && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--accent-light)' }}>
                                    {qr.qr_unique_id}
                                  </span>
                                  <span style={{
                                    fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
                                    padding: '2px 8px', borderRadius: 4,
                                    background: qr.is_active ? 'rgba(61,255,160,0.1)' : 'rgba(255,255,255,0.05)',
                                    color: qr.is_active ? 'var(--success)' : 'var(--text-muted)',
                                    border: `1px solid ${qr.is_active ? 'rgba(61,255,160,0.2)' : 'var(--border)'}`,
                                  }}>
                                    {qr.is_active ? 'Active' : 'Revoked'}
                                  </span>
                                  {qr.is_active && (
                                    <Link
                                      href={`/scan/${qr.qr_unique_id}`}
                                      target="_blank"
                                      style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)', textDecoration: 'none' }}
                                    >
                                      Preview →
                                    </Link>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Revoke Modal */}
      {revokeModal && (
        <div className="modal-overlay" onClick={() => setRevokeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, background: 'rgba(255,90,90,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconAlertTriangle size={20} color="var(--danger)" />
              </div>
              <h2 className="font-geist" style={{ fontSize: '1.1rem', fontWeight: 700 }}>Revoke All QR Codes?</h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
              All active QR codes for this project will be immediately invalidated. Anyone trying to scan them will be blocked. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setRevokeModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
              <button onClick={handleRevokeAll} disabled={revoking} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
                {revoking ? 'Revoking...' : 'Revoke All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
