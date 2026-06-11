'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import MetricCard from '@/components/dashboard/MetricCard'
import ProjectCard from '@/components/dashboard/ProjectCard'
import { IconPlus, IconFolder } from '@tabler/icons-react'

interface Project {
  id: string
  machine_name: string
  location?: string
  project_type: string
  created_at: string
  reports?: { status: string; created_at: string }[]
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalProjects: 0,
    activeQRs: 0,
    totalScans: 0,
    expiringSoon: 0,
  })

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch projects with latest report status
      const { data: projectsData } = await supabase
        .from('projects')
        .select(`
          id, machine_name, location, project_type, created_at,
          reports(id, status, created_at)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (projectsData) setProjects(projectsData as Project[])

      // Fetch QR metrics
      const { data: qrData } = await supabase
        .from('qr_codes')
        .select('id, is_active, expiry_date')
        .eq('user_id', user.id)

      const activeQRs = qrData?.filter(q => q.is_active).length || 0
      const now = new Date()
      const soon = new Date()
      soon.setDate(soon.getDate() + 30)
      const expiringSoon = qrData?.filter(q => {
        if (!q.expiry_date || !q.is_active) return false
        const exp = new Date(q.expiry_date)
        return exp > now && exp <= soon
      }).length || 0

      // Fetch scan count
      const { count: scanCount } = await supabase
        .from('scan_logs')
        .select('id', { count: 'exact', head: true })
        .in('qr_id', qrData?.map(q => q.id) || [])

      setMetrics({
        totalProjects: projectsData?.length || 0,
        activeQRs,
        totalScans: scanCount || 0,
        expiringSoon,
      })

      setLoading(false)
    }
    load()
  }, [])

  function getProjectStatus(project: Project): 'pass' | 'fail' | 'needs_attention' | 'none' {
    if (!project.reports || project.reports.length === 0) return 'none'
    const latest = project.reports.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]
    const s = latest.status?.toLowerCase()
    if (s === 'pass') return 'pass'
    if (s === 'fail') return 'fail'
    if (s === 'needs_attention' || s === 'needs attention') return 'needs_attention'
    return 'none'
  }

  async function deleteProject(projectId: string) {
    if (!confirm('Delete this project? This will delete all reports, QR codes, and files permanently.')) return

    const supabase = getSupabaseBrowserClient()

    try {
      // Get all report IDs for this project
      const { data: reports } = await supabase
        .from('reports')
        .select('id')
        .eq('project_id', projectId)

      if (reports && reports.length > 0) {
        const reportIds = reports.map(r => r.id)

        // Get all file paths to delete from storage
        const { data: files } = await supabase
          .from('files')
          .select('file_path')
          .in('report_id', reportIds)

        if (files && files.length > 0) {
          const paths = files.map(f => f.file_path).filter(Boolean)
          if (paths.length > 0) {
            await supabase.storage
              .from('project-qr-files')
              .remove(paths)
          }
        }
      }

      // Delete project — cascade handles reports, files, qr_codes, scan_logs
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) {
        console.error('Delete error:', error)
        alert('Failed to delete project: ' + error.message)
        return
      }

      // Only update UI after confirmed database deletion
      setProjects(prev => prev.filter(p => p.id !== projectId))

    } catch (err) {
      console.error('Unexpected delete error:', err)
      alert('Something went wrong. Please try again.')
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)'
      }}>
        <div>
          <h1 className="font-geist" style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 4 }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Monitor and manage all your industrial assets
          </p>
        </div>
        <Link href="/dashboard/new-project" className="btn btn-primary btn-sm">
          <IconPlus size={16} />
          New Project
        </Link>
      </div>

      {/* Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 40
      }}>
        <MetricCard label="Total Projects" value={metrics.totalProjects} loading={loading} />
        <MetricCard label="Active QR Codes" value={metrics.activeQRs} color="accent" loading={loading} />
        <MetricCard label="Total Scans" value={metrics.totalScans} loading={loading} />
        <MetricCard 
          label="Expiring Soon" 
          value={metrics.expiringSoon} 
          color={metrics.expiringSoon > 0 ? 'warning' : 'default'}
          subtext="within 30 days"
          loading={loading}
        />
      </div>

      {/* Projects */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 className="font-geist" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Your Projects
          </h2>
          <span style={{ 
            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            background: 'var(--bg-hover)',
            padding: '4px 10px', borderRadius: 20
          }}>
            {projects.length} total
          </span>
        </div>

        {loading ? (
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16
          }}>
            {[...Array(6)].map((_, i) => (
              <ProjectCard 
                key={i} id="" machineName="" projectType="" 
                reportCount={0} loading={true}
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          /* Empty state */
          <div className="card" style={{ 
            padding: 64, textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20
          }}>
            <div style={{
              width: 80, height: 80,
              background: 'rgba(108,99,255,0.1)',
              border: '1px solid rgba(108,99,255,0.2)',
              borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IconFolder size={36} color="var(--accent-light)" />
            </div>
            <div>
              <h3 className="font-geist" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>
                No projects yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.7 }}>
                Create your first project to start tracking industrial assets with QR-linked digital reports.
              </p>
            </div>
            <Link href="/dashboard/new-project" className="btn btn-primary">
              <IconPlus size={18} />
              Create your first project
            </Link>
          </div>
        ) : (
          <div 
            className="stagger-list"
            style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16
            }}
          >
            {projects.map(project => (
              <ProjectCard
                key={project.id}
                id={project.id}
                machineName={project.machine_name}
                location={project.location}
                projectType={project.project_type}
                status={getProjectStatus(project)}
                reportCount={project.reports?.length || 0}
                lastUpdated={
                  project.reports && project.reports.length > 0
                    ? project.reports.sort((a, b) => 
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                      )[0].created_at
                    : project.created_at
                }
                onDelete={() => deleteProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
