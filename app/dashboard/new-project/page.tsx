'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { IconArrowLeft, IconCheck } from '@tabler/icons-react'
import Link from 'next/link'

const projectTypes = ['Electrical', 'Mechanical', 'Software', 'Civil', 'Other']

export default function NewProjectPage() {
  const router = useRouter()
  const [projectName, setProjectName] = useState('')
  const [location, setLocation] = useState('')
  const [projectType, setProjectType] = useState('Mechanical')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!projectName.trim()) return
    
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
          machine_name: projectName.trim(),
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
    <div className="legacy-light-theme" style={{ maxWidth: 600, margin: '0 auto' }}>
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
      <div className="mb-12 pt-8">
        <h1 className="font-[family-name:var(--font-instrument)] text-5xl text-[#1A1A1A] mb-4 font-bold">
          New Project
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-[#1A1A1A] font-semibold">
          Create a project for an industrial asset you want to track
        </p>
      </div>

      {/* Form */}
      <div className="animate-fade-up rounded-3xl border border-black/[0.05] bg-white/70 p-10 shadow-2xl backdrop-blur-3xl">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
              Project Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-black/20 bg-black/[0.02] px-4 py-3.5 text-sm font-semibold text-[#1A1A1A] outline-none transition-colors placeholder:text-[#1A1A1A]/50 focus:border-[#4A90E2] focus:bg-white focus:shadow-[0_0_0_4px_rgba(74,144,226,0.1)]"
              placeholder="e.g. Hydraulic Press Unit 4"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
              Location
            </label>
            <input
              type="text"
              className="w-full rounded-xl border border-black/20 bg-black/[0.02] px-4 py-3.5 text-sm font-semibold text-[#1A1A1A] outline-none transition-colors placeholder:text-[#1A1A1A]/50 focus:border-[#4A90E2] focus:bg-white focus:shadow-[0_0_0_4px_rgba(74,144,226,0.1)]"
              placeholder="e.g. Factory Floor A, Building 3 (optional)"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-3 block font-mono text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
              Project Type
            </label>
            <div className="flex flex-wrap gap-2">
              {projectTypes.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setProjectType(type)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                    projectType === type
                      ? "border-[#4A90E2] bg-[#4A90E2]/10 text-[#4A90E2]"
                      : "border-black/20 bg-white text-[#1A1A1A] hover:bg-black/[0.02]"
                  }`}
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
          <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 text-xs font-semibold leading-relaxed text-[#1A1A1A]">
            After creating the project, you'll be taken to the upload page to add your first inspection report and generate QR codes.
          </div>

          <div className="mt-4 flex gap-3">
            <Link 
              href="/dashboard" 
              className="flex flex-1 items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-4 text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-black/5"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-6 py-4 text-sm font-semibold text-white transition-all hover:bg-black disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
