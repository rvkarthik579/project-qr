'use client'
import retriqoLogo from '@/public/retriqo-logo.svg';
import Image from 'next/image';
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  IconLayoutDashboard, 
  IconPlus, 
  IconChartBar, 
  IconSettings,
  IconLogout
} from '@tabler/icons-react'
import { signOut } from '@/lib/auth'

interface SidebarProps {
  user?: {
    name?: string
    email?: string
    avatar_url?: string
  }
  deviceCount?: number
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { href: '/dashboard/new-project', label: 'New Project', icon: IconPlus },
  { href: '/dashboard/analytics', label: 'Analytics', icon: IconChartBar },
  { href: '/dashboard/settings', label: 'Settings', icon: IconSettings },
]

export default function Sidebar({ user, deviceCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <div className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <Image src={retriqoLogo} alt="Retriqo" style={{ height: '24px' , width: 'auto'}} priority unoptimized />
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {navItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${active ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span style={{ fontSize: '0.9rem', flex: 1 }}>{item.label}</span>
              {item.href === '/dashboard/analytics' && deviceCount > 0 && (
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.7rem',
                  background: 'rgba(108,99,255,0.2)',
                  color: 'var(--accent-light)',
                  padding: '2px 7px',
                  borderRadius: 10,
                  border: '1px solid rgba(108,99,255,0.2)',
                }}>
                  {deviceCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleSignOut}
          className="sidebar-nav-item"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 4 }}
        >
          <IconLogout size={16} />
          <span style={{ fontSize: '0.875rem' }}>Sign out</span>
        </button>
        
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px',
          margin: '4px 0',
          borderRadius: 8,
        }}>
          <div style={{
            width: 32, height: 32,
            background: user?.avatar_url ? 'transparent' : 'var(--accent)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden'
          }}>
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', fontWeight: 500, color: 'white' }}>
                {initials}
              </span>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-primary)', 
              fontWeight: 500,
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{ 
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.7rem', 
              color: 'var(--text-muted)',
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap' 
            }}>
              {user?.email || ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
