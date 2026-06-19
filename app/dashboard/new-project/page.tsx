'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { IconArrowLeft, IconCheck } from '@tabler/icons-react'
import Link from 'next/link'

const projectTypes = ['Electrical', 'Mechanical', 'Software', 'Civil', 'Other']

export default function NewProjectPage() {
  const router = useRouter()
  const [machineName, setMachineName] = useState('')
  const [location, setLocation] = useState('')
  const [projectType, setProjectType] = useState('Mechanical')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!machineName.trim()) return
    
    setLoading(true)
    setError('')

    try {
      const supabase = getSupabaseBrowserClient()
      
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        router.push('/login')
        return
      }

      const { data: project, error: insertError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          machine_name: machineName.trim(),
          location: location.trim() || null,
          project_type: projectType || null,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        setError('Failed to create project: ' + insertError.message)
        return
      }

      if (!project?.id) {
        setError('Project created but no ID returned. Please try again.')
        return
      }

      // Only redirect AFTER confirmed successful insert
      router.push(`/dashboard/projects/${project.id}/upload`)

    } catch (err) {
      console.error('Unexpected error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Back */}
      <Link 
        href="/dashboard" 
        style={{ 
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem',
          marginBottom: 32, transition: 'color 150ms ease'
        }}
        className="hover:text-primary"
      >
        <IconArrowLeft size={16} />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-geist" style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>
          New Project
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Create a project for an industrial asset or machine you want to track
        </p>
      </div>

      {/* Form */}
      <div className="card animate-fade-up" style={{ padding: 32 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label className="label">
              Machine Name <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Hydraulic Press Unit 4, Generator Block B"
              value={machineName}
              onChange={e => setMachineName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="label">Location</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Factory Floor A, Building 3 — optional"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Project Type</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {projectTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProjectType(type)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    border: `1px solid ${projectType === type ? 'rgba(108,99,255,0.4)' : 'var(--border)'}`,
                    background: projectType === type ? 'rgba(108,99,255,0.1)' : 'transparent',
                    color: projectType === type ? 'var(--accent-light)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 150ms ease',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  {projectType === type && <IconCheck size={14} />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255,90,90,0.08)',
              border: '1px solid rgba(255,90,90,0.2)',
              borderRadius: 8,
              color: 'var(--danger)',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {/* Info */}
          <div style={{
            padding: '14px 16px',
            background: 'rgba(108,99,255,0.05)',
            border: '1px solid rgba(108,99,255,0.15)',
            borderRadius: 8,
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            After creating the project, you'll be taken to the upload page to add your first inspection report and generate QR codes.
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/dashboard" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 2, justifyContent: 'center' }}
            >
              {loading ? 'Creating...' : 'Create Project →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
