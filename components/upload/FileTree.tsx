'use client'

import { useState } from 'react'
import { 
  IconFile, IconFolder, IconFolderOpen, IconChevronRight,
  IconFileTypePdf, IconFileTypeDoc, IconZip, IconCheck
} from '@tabler/icons-react'

export interface TreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  file?: File
  children?: TreeNode[]
  selected?: boolean
}

interface FileTreeProps {
  nodes: TreeNode[]
  selectedPaths: Set<string>
  customTitles: Map<string, string>
  onToggle: (path: string, file?: File) => void
  onTitleChange: (path: string, title: string) => void
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  const style = { flexShrink: 0 }
  switch (ext) {
    case 'pdf': return { icon: <IconFileTypePdf size={16} color="#ff5a5a" style={style} />, badge: 'PDF', color: '#ff5a5a', bg: 'rgba(255,90,90,0.1)' }
    case 'docx': case 'doc': return { icon: <IconFileTypeDoc size={16} color="#4e9eff" style={style} />, badge: 'DOC', color: '#4e9eff', bg: 'rgba(78,158,255,0.1)' }
    case 'zip': return { icon: <IconZip size={16} color="#f0c060" style={style} />, badge: 'ZIP', color: '#f0c060', bg: 'rgba(240,192,96,0.1)' }
    case 'rar': return { icon: <IconZip size={16} color="#ff5a5a" style={style} />, badge: 'RAR', color: '#ff5a5a', bg: 'rgba(255,90,90,0.1)' }
    case 'war': return { icon: <IconZip size={16} color="#a89cff" style={style} />, badge: 'WAR', color: '#a89cff', bg: 'rgba(168,156,255,0.1)' }
    case 'ear': return { icon: <IconZip size={16} color="#3dffa0" style={style} />, badge: 'EAR', color: '#3dffa0', bg: 'rgba(61,255,160,0.1)' }
    case 'gz': case 'tar': return { icon: <IconZip size={16} color="#f0c060" style={style} />, badge: 'TAR', color: '#f0c060', bg: 'rgba(240,192,96,0.1)' }
    case '7z': return { icon: <IconZip size={16} color="#a89cff" style={style} />, badge: '7Z', color: '#a89cff', bg: 'rgba(168,156,255,0.1)' }
    default: return { icon: <IconFile size={16} color="var(--text-muted)" style={style} />, badge: ext?.toUpperCase() || 'FILE', color: 'var(--text-muted)', bg: 'rgba(255,255,255,0.05)' }
  }
}

function TreeNodeItem({ 
  node, depth, selectedPaths, customTitles, onToggle, onTitleChange
}: { 
  node: TreeNode
  depth: number
  selectedPaths: Set<string>
  customTitles: Map<string, string>
  onToggle: (path: string, file?: File) => void
  onTitleChange: (path: string, title: string) => void
}) {
  const [open, setOpen] = useState(depth < 2)
  const isSelected = selectedPaths.has(node.path)

  if (node.type === 'folder') {
    return (
      <div>
        <div
          className="file-tree-item"
          style={{ paddingLeft: 8 + depth * 20 }}
          onClick={() => setOpen(o => !o)}
        >
          <span className={`file-tree-chevron ${open ? 'open' : ''}`} style={{ color: 'var(--text-muted)' }}>
            <IconChevronRight size={14} />
          </span>
          {open 
            ? <IconFolderOpen size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
            : <IconFolder size={16} color="var(--warning)" style={{ flexShrink: 0 }} />
          }
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', flex: 1 }}>
            {node.name}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
            {node.children?.filter(c => c.type === 'file').length} files
          </span>
        </div>
        {open && node.children && (
          <div className="animate-slide-down">
            {node.children.map((child, i) => (
              <TreeNodeItem
                key={i}
                node={child}
                depth={depth + 1}
                selectedPaths={selectedPaths}
                customTitles={customTitles}
                onToggle={onToggle}
                onTitleChange={onTitleChange}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const { icon, badge, color, bg } = getFileIcon(node.name)

  return (
    <div
      className={`file-tree-item ${isSelected ? 'selected' : ''}`}
      style={{ 
        paddingLeft: 8 + depth * 20, alignItems: 'center', 
        background: isSelected ? 'var(--bg-hover)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent'
      }}
    >
      <div 
        style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer', gap: 8 }}
        onClick={() => onToggle(node.path, node.file)}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 6,
          border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
          background: isSelected ? 'var(--accent)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 100ms ease', flexShrink: 0
        }}>
          {isSelected && <IconCheck size={14} color="white" />}
        </div>
        {icon}
        <span style={{ 
          color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', 
          fontSize: '0.875rem',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: isSelected ? '40%' : '100%'
        }}>
          {node.name}
        </span>
      </div>

      {isSelected && (
        <input 
          type="text"
          placeholder="Custom Title (Optional)"
          value={customTitles.get(node.path) || ''}
          onChange={(e) => onTitleChange(node.path, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            background: 'var(--bg-hover)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            padding: '4px 8px',
            fontSize: '0.8rem',
            borderRadius: 4,
            marginLeft: 8,
            marginRight: 8
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => onToggle(node.path, node.file)}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem',
          padding: '2px 6px', borderRadius: 4,
          background: bg, color: color,
          border: `1px solid ${color}33`,
          flexShrink: 0
        }}>
          {badge}
        </span>
        {isSelected && (
          <div style={{
            width: 24, height: 24,
            background: 'var(--bg-card)', borderRadius: 6,
            border: '1px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 0 2px rgba(74,144,226,0.1)'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FileTree({ nodes, selectedPaths, customTitles, onToggle, onTitleChange }: FileTreeProps) {
  if (nodes.length === 0) return null

  return (
    <div>
      <div style={{ 
        background: 'rgba(74,144,226,0.04)', border: '1px solid rgba(74,144,226,0.15)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20
      }}>
        <h3 style={{ fontFamily: 'Geist, sans-serif', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          STEP 2 — SELECT FILES
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
          Select the files that should receive individual QR codes.
        </p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            <div style={{ color: 'var(--success)' }}><IconCheck size={16} /></div> Click a file to include it
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            <div style={{ color: 'var(--success)' }}><IconCheck size={16} /></div> Blue check means selected
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
            <div style={{ color: 'var(--success)' }}><IconCheck size={16} /></div> One selected file = one QR code
          </li>
        </ul>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
      maxHeight: 400,
      overflowY: 'auto'
    }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          File Tree
        </span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--accent-light)' }}>
          {selectedPaths.size} selected
        </span>
      </div>
      <div style={{ padding: '8px 4px' }}>
        {nodes.map((node, i) => (
          <TreeNodeItem
            key={i}
            node={node}
            depth={0}
            selectedPaths={selectedPaths}
            customTitles={customTitles}
            onToggle={onToggle}
            onTitleChange={onTitleChange}
          />
        ))}
      </div>
    </div>
    </div>
  )
}
