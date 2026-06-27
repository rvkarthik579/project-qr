'use client'

import { useEffect, useState } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { IconUser, IconBuilding, IconShield, IconAlertTriangle, IconCheck } from '@tabler/icons-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  
  // Profile
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  
  // Org
  const [companyName, setCompanyName] = useState('')
  
  // Security defaults
  const [defaultExpiry, setDefaultExpiry] = useState('90d')
  const [defaultPinRequired, setDefaultPinRequired] = useState(false)
  const [maxFailedAttempts, setMaxFailedAttempts] = useState(3)
  
  // Modals
  const [deleteQRModal, setDeleteQRModal] = useState(false)
  const [deleteAccountModal, setDeleteAccountModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  
  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => { loadProfile() }, [])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function loadProfile() {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setEmail(user.email || '')

    const { data } = await supabase
      .from('users')
      .select('name, avatar_url, company_name')
      .eq('id', user.id)
      .single()

    if (data) {
      setName(data.name || user.user_metadata?.name || '')
      setAvatarUrl(data.avatar_url || user.user_metadata?.avatar_url || '')
      setCompanyName(data.company_name || '')
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving('profile')
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('users')
      .upsert({ id: user.id, name, email, avatar_url: avatarUrl, updated_at: new Date().toISOString() })

    setSaving(null)
    if (error) showToast(error.message, 'error')
    else showToast('Profile updated successfully')
  }

  async function saveOrg() {
    setSaving('org')
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('users')
      .update({ company_name: companyName })
      .eq('id', user.id)

    setSaving(null)
    if (error) showToast(error.message, 'error')
    else showToast('Organization updated')
  }

  async function deleteAllQRs() {
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('user_id', user.id)

    setDeleteQRModal(false)
    if (error) showToast('Failed to delete QR codes', 'error')
    else showToast('All QR codes deleted')
  }

  async function deleteAccount() {
    if (deleteConfirmText !== 'DELETE') return
    const supabase = getSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Delete user data
    await supabase.from('qr_codes').delete().eq('user_id', user.id)
    await supabase.from('reports').delete().eq('user_id', user.id)
    await supabase.from('projects').delete().eq('user_id', user.id)
    await supabase.from('users').delete().eq('id', user.id)
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          padding: '12px 20px',
          background: toast.type === 'success' ? 'rgba(61,255,160,0.1)' : 'rgba(255,90,90,0.1)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(61,255,160,0.3)' : 'rgba(255,90,90,0.3)'}`,
          borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 10,
          color: toast.type === 'success' ? 'var(--success)' : 'var(--danger)',
          fontSize: '0.875rem',
          animation: 'fade-up 200ms ease',
        }}>
          {toast.type === 'success' ? <IconCheck size={16} /> : <IconAlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
        <h1 className="font-geist" style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your account, organization, and security preferences</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Profile */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(108,99,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconUser size={18} color="var(--accent-light)" />
            </div>
            <h2 className="font-geist" style={{ fontSize: '1rem', fontWeight: 600 }}>Profile</h2>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 48 }} />)}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 8 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: avatarUrl ? 'transparent' : 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', border: '2px solid var(--border)',
                  flexShrink: 0
                }}>
                  {avatarUrl
                    ? /* eslint-disable-next-line @next/next/no-img-element */
<img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.25rem', fontWeight: 500, color: 'white' }}>{initials}</span>
                  }
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                    Profile photo
                  </div>
                  <input
                    type="url"
                    className="input"
                    placeholder="https://... (avatar URL)"
                    value={avatarUrl}
                    onChange={e => setAvatarUrl(e.target.value)}
                    style={{ width: '100%', maxWidth: 280, fontSize: '0.8125rem', padding: '8px 12px' }}
                  />
                </div>
              </div>
              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input type="email" className="input" value={email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>
              <button onClick={saveProfile} disabled={saving === 'profile'} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                {saving === 'profile' ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}
        </div>

        {/* Organization */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(108,99,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconBuilding size={18} color="var(--accent-light)" />
            </div>
            <h2 className="font-geist" style={{ fontSize: '1rem', fontWeight: 600 }}>Organization</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="label">Company Name</label>
              <input
                type="text"
                className="input"
                placeholder="Acme Industrial Corp"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                This name appears on printed QR labels when "Show company name" is enabled
              </p>
            </div>
            <button onClick={saveOrg} disabled={saving === 'org'} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
              {saving === 'org' ? 'Saving...' : 'Save Organization'}
            </button>
          </div>
        </div>

        {/* Security Defaults */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(108,99,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconShield size={18} color="var(--accent-light)" />
            </div>
            <h2 className="font-geist" style={{ fontSize: '1rem', fontWeight: 600 }}>Security Defaults</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label className="label">Default QR Expiry</label>
              <select className="select" value={defaultExpiry} onChange={e => setDefaultExpiry(e.target.value)}>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
                <option value="1y">1 Year</option>
                <option value="never">Never</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: 2 }}>Require PIN by default</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>New QR codes will require a PIN to view</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={defaultPinRequired} onChange={e => setDefaultPinRequired(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
            <div>
              <label className="label">Max Failed PIN Attempts</label>
              <select className="select" value={maxFailedAttempts} onChange={e => setMaxFailedAttempts(+e.target.value)}>
                <option value={3}>3 attempts</option>
                <option value={5}>5 attempts</option>
                <option value={10}>10 attempts</option>
              </select>
            </div>
            <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
              Save Security Defaults
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="danger-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,90,90,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconAlertTriangle size={18} color="var(--danger)" />
            </div>
            <h2 className="font-geist" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--danger)' }}>Danger Zone</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid rgba(255,90,90,0.1)', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: 2 }}>Delete All QR Codes</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Permanently deactivate and remove all your QR codes. Files are preserved.
                </div>
              </div>
              <button onClick={() => setDeleteQRModal(true)} className="btn btn-danger btn-sm">
                Delete All QR Codes
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 500, marginBottom: 2 }}>Delete Account</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Permanently delete your account and all associated data. This cannot be undone.
                </div>
              </div>
              <button onClick={() => setDeleteAccountModal(true)} className="btn btn-danger btn-sm">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete QR Modal */}
      {deleteQRModal && (
        <div className="modal-overlay" onClick={() => setDeleteQRModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="font-geist" style={{ marginBottom: 12 }}>Delete All QR Codes?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
              All your QR codes will be permanently deleted. Anyone who scans them will see an error. Your project files will be preserved.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteQRModal(false)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={deleteAllQRs} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>Delete All</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {deleteAccountModal && (
        <div className="modal-overlay" onClick={() => setDeleteAccountModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="font-geist" style={{ marginBottom: 12, color: 'var(--danger)' }}>Delete Account?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.7 }}>
              This will permanently delete your account, all projects, reports, files, and QR codes. <strong style={{ color: 'var(--text-primary)' }}>This cannot be undone.</strong>
            </p>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Type DELETE to confirm</label>
              <input
                type="text"
                className="input"
                placeholder="DELETE"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setDeleteAccountModal(false); setDeleteConfirmText('') }} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button onClick={deleteAccount} disabled={deleteConfirmText !== 'DELETE'} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>Delete My Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
