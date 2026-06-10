'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import { getSupabaseBrowserClient } from '@/lib/supabase'

import { uploadFile } from '@/lib/storage'
import { generateQRId, getExpiryFromPreset } from '@/lib/qr'
import FileTree, { TreeNode } from '@/components/upload/FileTree'
import Link from 'next/link'
import {
  IconUpload, IconCheck, IconArrowLeft, IconArrowRight,
  IconAlertCircle, IconX
} from '@tabler/icons-react'
import { QRCodeSVG } from 'qrcode.react'

let archiveInitialized = false

async function initArchive() {
  if (archiveInitialized) return
  try {
    // @ts-expect-error: missing type definitions
    const { Archive } = await import('libarchive.js/main.js')
    await Archive.init({ workerUrl: '/worker-bundle.js' })
    archiveInitialized = true
    return Archive
  } catch (err) {
    console.error('Archive init failed:', err)
    return null
  }
}

const STEPS = ['Upload', 'Select Files', 'Settings', 'Generate']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ACCEPTED_TYPES = [
  '.zip', '.rar', '.tar', '.gz', '.7z', '.ear', 
  '.war', '.pdf', '.docx', '.doc', '.tar.gz'
]

const ARCHIVE_TYPES = ['.zip', '.rar', '.tar', '.gz', '.7z', '.ear', '.war']

interface GeneratedQR {
  qrUniqueId: string
  machineName: string
  fileName: string
  status: 'pass' | 'fail' | 'needs_attention'
  expiryDate: string | null
  generatedDate: string
  fileUrl: string
}

export default function UploadPage({ params }: { params: { id: string } }) {
  const { id: projectId } = params as { id: string }
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [processingFiles, setProcessingFiles] = useState(false)
  const [extractionError, setExtractionError] = useState('')
  const [extractingArchiveType, setExtractingArchiveType] = useState('ZIP')
  
  // Step 1: Upload (includes optional status)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([])
  const [reportStatus, setReportStatus] = useState<'pass' | 'fail' | 'needs_attention'>('pass')
  const [remarks, setRemarks] = useState('')
  
  // Step 2: Select Files
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [selectedFiles, setSelectedFiles] = useState<Map<string, File>>(new Map())
  const [totalFiles, setTotalFiles] = useState(0)
  
  // Step 3: Settings
  const [expiryPreset, setExpiryPreset] = useState<'30d' | '90d' | '1y' | 'never'>('90d')
  const [expiryDate, setExpiryDate] = useState<string | null>(getExpiryFromPreset('90d'))
  const [requirePin, setRequirePin] = useState(false)
  const [pin, setPin] = useState('')
  
  // Step 4: Generate
  const [generating, setGenerating] = useState(false)
  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([])
  const [generateError, setGenerateError] = useState('')
  const [projectName, setProjectName] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    setExpiryDate(getExpiryFromPreset(expiryPreset))
  }, [expiryPreset])

  // Count total files recursively for UI
  useEffect(() => {
    let count = 0
    function traverse(nodes: TreeNode[]) {
      nodes.forEach(n => {
        if (n.type === 'file') count++
        if (n.children) traverse(n.children)
      })
    }
    traverse(treeNodes)
    setTotalFiles(count)
  }, [treeNodes])

  function selectAll() {
    const allPaths = new Set<string>()
    const allFiles = new Map<string, File>()
    function traverse(nodes: TreeNode[]) {
      nodes.forEach(node => {
        if (node.type === 'file' && node.file) {
          allPaths.add(node.path)
          allFiles.set(node.path, node.file)
        } else if (node.children) {
          traverse(node.children)
        }
      })
    }
    traverse(treeNodes)
    setSelectedPaths(allPaths)
    setSelectedFiles(allFiles)
  }

  function deselectAll() {
    setSelectedPaths(new Set())
    setSelectedFiles(new Map())
  }

  async function buildTreeFromZip(file: File): Promise<TreeNode[]> {
    const zip = new JSZip()
    const contents = await zip.loadAsync(file)
    const folderMap = new Map<string, TreeNode>()
    const rootNodes: TreeNode[] = []

    const entries = Object.keys(contents.files)
      .filter(path => !contents.files[path].dir && 
        !path.startsWith('__MACOSX') &&
        !path.includes('.DS_Store'))
      .sort()

    const fileObjects = await Promise.all(
      entries.map(async (path) => {
        const parts = path.split('/')
        const fileName = parts[parts.length - 1]
        if (!fileName) return null
        const blob = await contents.files[path].async('blob')
        return { path, parts, fileName, file: new File([blob], fileName) }
      })
    )

    for (const item of fileObjects) {
      if (!item) continue
      const { path, parts, fileName, file: fileObj } = item

      if (parts.length === 1) {
        rootNodes.push({ name: fileName, path, type: 'file', file: fileObj })
      } else {
        let parentList = rootNodes
        let currentPath = ''
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath = i === 0 ? parts[i] : currentPath + '/' + parts[i]
          let folder = folderMap.get(currentPath)
          if (!folder) {
            folder = { 
              name: parts[i], 
              path: currentPath, 
              type: 'folder', 
              children: [] 
            }
            folderMap.set(currentPath, folder)
            parentList.push(folder)
          }
          parentList = folder.children!
        }
        parentList.push({ name: fileName, path, type: 'file', file: fileObj })
      }
    }

    return rootNodes
  }

  async function buildTreeFromArchive(file: File): Promise<TreeNode[]> {
    try {
      await initArchive()
      // @ts-expect-error: missing type definitions
      const { Archive } = await import('libarchive.js/main.js')
      const archive = await Archive.open(file)
      const obj = await archive.extractFiles()
      
      const rootNodes: TreeNode[] = []
      const folderMap = new Map<string, TreeNode>()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const processEntry = (entry: any, path: string) => {
        if (entry instanceof File) {
          const parts = path.split('/')
          const fileName = parts[parts.length - 1]
          if (!fileName || fileName.startsWith('.')) return

          if (parts.length === 1) {
            rootNodes.push({ name: fileName, path, type: 'file', file: entry })
          } else {
            let parentList = rootNodes
            let currentPath = ''
            for (let i = 0; i < parts.length - 1; i++) {
              currentPath = i === 0 ? parts[i] : currentPath + '/' + parts[i]
              let folder = folderMap.get(currentPath)
              if (!folder) {
                folder = { name: parts[i], path: currentPath, type: 'folder', children: [] }
                folderMap.set(currentPath, folder)
                parentList.push(folder)
              }
              parentList = folder.children!
            }
            parentList.push({ name: fileName, path, type: 'file', file: entry })
          }
        } else if (typeof entry === 'object') {
          Object.keys(entry).forEach(key => {
            processEntry(entry[key], path ? path + '/' + key : key)
          })
        }
      }

      processEntry(obj, '')
      return rootNodes
    } catch (err) {
      console.error('Archive extraction failed:', err)
      return []
    }
  }

  async function processFiles(files: File[]) {
    setProcessingFiles(true)
    setExtractionError('')
    try {
      const validFiles = files.filter(f => {
        const name = f.name.toLowerCase()
        return ACCEPTED_TYPES.some(ext => name.endsWith(ext)) && 
               f.size <= MAX_FILE_SIZE
      })

      if (validFiles.length === 0) {
        setProcessingFiles(false)
        return
      }
      
      setUploadedFiles(validFiles)
      const allNodes: TreeNode[] = []
      let containsArchive = false

      const extractWithTimeout = async (file: File) => {
        return Promise.race([
          buildTreeFromArchive(file),
          new Promise<TreeNode[]>((_, reject) => 
            setTimeout(() => reject(new Error('Extraction timed out')), 10000)
          )
        ])
      }

      for (const file of validFiles) {
        const name = file.name.toLowerCase()
        const isArchive = ARCHIVE_TYPES.some(ext => name.endsWith(ext))

        if (isArchive) {
          containsArchive = true
          setExtractingArchiveType(name.split('.').pop()?.toUpperCase() || 'ZIP')
          setProcessingFiles(true)
          let archiveNodes: TreeNode[] = []
          
          if (name.endsWith('.zip')) {
            try {
              archiveNodes = await buildTreeFromZip(file)
            } catch {
              try {
                archiveNodes = await extractWithTimeout(file)
              } catch {
                archiveNodes = []
              }
            }
          } else {
            try {
              archiveNodes = await extractWithTimeout(file)
            } catch {
              archiveNodes = []
            }
          }

          if (archiveNodes.length > 0) {
            allNodes.push({ 
              name: file.name, 
              path: file.name, 
              type: 'folder', 
              children: archiveNodes 
            })
          } else {
            setExtractionError("Could not expand this archive automatically. \nThe file will be uploaded as a single item.")
            containsArchive = false
            allNodes.push({ 
              name: file.name, 
              path: file.name, 
              type: 'file', 
              file 
            })
          }
        } else {
          allNodes.push({ 
            name: file.name, 
            path: file.name, 
            type: 'file', 
            file 
          })
        }
      }

      setTreeNodes(allNodes)
      setProcessingFiles(false)
      
      // Auto advance logic
      if (!containsArchive) {
        setCurrentStep(2) // Jump straight to Settings
      }
    } catch (err) {
      console.error('File processing error:', err)
      setProcessingFiles(false)
    }
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    await processFiles(files)
  }, [])

  function handleToggleFile(path: string, file?: File) {
    const newPaths = new Set(selectedPaths)
    const newFiles = new Map(selectedFiles)
    if (newPaths.has(path)) {
      newPaths.delete(path)
      newFiles.delete(path)
    } else {
      newPaths.add(path)
      if (file) newFiles.set(path, file)
    }
    setSelectedPaths(newPaths)
    setSelectedFiles(newFiles)
  }

  async function loadProjectName() {
    const supabase = getSupabaseBrowserClient()
    const { data } = await supabase.from('projects').select('machine_name').eq('id', projectId).single()
    if (data) setProjectName(data.machine_name)
  }

  async function handleGenerate() {
    if (selectedFiles.size === 0 && uploadedFiles.length === 0) {
      setGenerateError('Please select at least one file')
      return
    }
    
    setGenerating(true)
    setGenerateError('')
    
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      if (!projectName) await loadProjectName()

      const { data: project } = await supabase
        .from('projects')
        .select('machine_name')
        .eq('id', projectId)
        .single()
      const machine = project?.machine_name || projectName

      // Create report
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          project_id: projectId,
          user_id: user.id,
          status: reportStatus,
          remarks: remarks || null,
          next_inspection_date: null,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (reportError) throw new Error(reportError.message)

      const filesToProcess = selectedFiles.size > 0 
        ? Array.from(selectedFiles.entries()).map(([path, file]) => ({ path, file }))
        : uploadedFiles.map(f => ({ path: f.name, file: f }))

      const generated: GeneratedQR[] = []
      let processed = 0

      for (const { file } of filesToProcess) {
        setUploadProgress(Math.round((processed / filesToProcess.length) * 90))

        const { path: storagePath, url, error: uploadErr } = await uploadFile(
          file, user.id, projectId, report.id
        )
        if (uploadErr) throw new Error(`Failed to upload ${file.name}: ${uploadErr}`)

        const { data: fileRecord, error: fileErr } = await supabase
          .from('files')
          .insert({
            report_id: report.id,
            file_name: file.name,
            file_path: storagePath,
            file_type: file.type || 'application/octet-stream',
            file_size: file.size,
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single()

        if (fileErr) throw new Error(fileErr.message)

        const qrUniqueId = generateQRId()

        let passwordHash = null
        if (requirePin && pin.length === 4) {
          const response = await fetch('/api/qr/hash-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin }),
          })
          const { hash } = await response.json()
          passwordHash = hash
        }

        const { error: qrErr } = await supabase
          .from('qr_codes')
          .insert({
            file_id: fileRecord.id,
            report_id: report.id,
            user_id: user.id,
            qr_unique_id: qrUniqueId,
            password_hash: passwordHash,
            expiry_date: expiryDate,
            next_inspection_date: null,
            show_company: false,
            show_uploader_name: false,
            show_next_inspection: false,
            is_active: true,
            created_at: new Date().toISOString(),
          })

        if (qrErr) throw new Error(qrErr.message)

        generated.push({
          qrUniqueId,
          machineName: machine,
          fileName: file.name,
          status: reportStatus,
          expiryDate,
          generatedDate: new Date().toISOString(),
          fileUrl: url,
        })

        processed++
      }

      setUploadProgress(100)
      setGeneratedQRs(generated)
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function canProceed() {
    if (currentStep === 0) return uploadedFiles.length > 0
    if (currentStep === 2) return !requirePin || pin.length === 4
    return true
  }

  function goNextStep() {
    if (currentStep === 0) {
      if (treeNodes.some(n => n.type === 'folder')) setCurrentStep(1)
      else setCurrentStep(2)
    } else {
      setCurrentStep(s => s + 1)
    }
  }

  function goPrevStep() {
    if (currentStep === 2 && !treeNodes.some(n => n.type === 'folder')) {
      setCurrentStep(0)
    } else {
      setCurrentStep(s => s - 1)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Link
        href={`/dashboard/projects/${projectId}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem',
          marginBottom: 24, transition: 'color 150ms ease'
        }}
      >
        <IconArrowLeft size={16} />
        Back to Project
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 className="font-geist" style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>
          Upload Files
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Create secure QR codes for your documents
        </p>
      </div>

      <div className="step-indicator" style={{ marginBottom: 32, overflowX: 'auto' }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={`step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
              style={{ cursor: 'default' }}
            >
              <div className="step-number">
                {i < currentStep ? <IconCheck size={12} /> : i + 1}
              </div>
              <span className="step-label" style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && <div className="step-connector" />}
          </div>
        ))}
      </div>

      <div className="card animate-fade-up" style={{ padding: 32 }}>

        {/* STEP 1: Upload */}
        {currentStep === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 className="font-geist" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                Upload Files
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Drag & drop ZIP, RAR, 7Z, TAR, PDF, or DOCX files. Max 50MB. Archives will be expanded automatically.
              </p>
            </div>

            <div
              className={`dropzone ${dragging ? 'active' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{
                width: 56, height: 56,
                background: 'rgba(108,99,255,0.1)',
                border: '1px solid rgba(108,99,255,0.2)',
                borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <IconUpload size={24} color="var(--accent-light)" />
              </div>
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500, marginBottom: 4 }}>
                  Drop files here or click to browse
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ZIP · RAR · 7Z · TAR · PDF · DOCX — max 50MB
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".zip,.rar,.tar,.gz,.7z,.ear,.war,.pdf,.docx,.doc"
                style={{ display: 'none' }}
                onChange={async e => {
                  if (e.target.files) await processFiles(Array.from(e.target.files))
                }}
              />
            </div>

            {processingFiles && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px',
                background: 'rgba(108,99,255,0.06)',
                border: '1px solid rgba(108,99,255,0.15)',
                borderRadius: 8,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.8125rem',
                color: '#a89cff'
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid #6c63ff',
                  borderTopColor: 'transparent',
                  animation: 'spin 600ms linear infinite'
                }} />
                Extracting {extractingArchiveType} archive...
              </div>
            )}

            {extractionError && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px',
                background: 'rgba(255,90,90,0.08)',
                border: '1px solid rgba(255,90,90,0.2)',
                borderRadius: 8, textAlign: 'left'
              }}>
                <IconAlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--danger)', whiteSpace: 'pre-line' }}>{extractionError}</span>
              </div>
            )}

            {uploadedFiles.length > 0 && !processingFiles && (
              <div className="animate-slide-down">
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--bg-hover)', borderRadius: 8, padding: '12px 16px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <IconCheck size={16} color="var(--success)" />
                    <span>{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded successfully</span>
                  </div>
                  <button
                    onClick={() => { setUploadedFiles([]); setTreeNodes([]); setSelectedPaths(new Set()); setSelectedFiles(new Map()) }}
                    style={{ 
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: '0.8125rem',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <IconX size={14} /> Clear
                  </button>
                </div>
              </div>
            )}

            <div style={{marginTop: 24}}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, color: '#5e5c80',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 12
              }}>
                Inspection Status (optional)
              </p>
              <div style={{display: 'flex', gap: 8}}>
                {['Pass', 'Needs Attention', 'Fail'].map(s => (
                  <button
                    key={s}
                    onClick={() => setReportStatus(s.toLowerCase().replace(' ', '_') as any)}
                    style={{
                      flex: 1, padding: '10px 8px',
                      borderRadius: 8,
                      border: `1px solid ${
                        reportStatus === s.toLowerCase().replace(' ', '_')
                          ? s === 'Pass' ? 'rgba(61,255,160,0.4)'
                          : s === 'Fail' ? 'rgba(255,90,90,0.4)'
                          : 'rgba(240,192,96,0.4)'
                          : 'rgba(255,255,255,0.07)'
                      }`,
                      background: reportStatus === s.toLowerCase().replace(' ', '_')
                        ? s === 'Pass' ? 'rgba(61,255,160,0.08)'
                        : s === 'Fail' ? 'rgba(255,90,90,0.08)'
                        : 'rgba(240,192,96,0.08)'
                        : 'transparent',
                      color: reportStatus === s.toLowerCase().replace(' ', '_')
                        ? s === 'Pass' ? '#3dffa0'
                        : s === 'Fail' ? '#ff5a5a'
                        : '#f0c060'
                        : '#5e5c80',
                      fontSize: 13, fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    {s === 'Pass' ? '✓ Pass' : s === 'Fail' ? '✕ Fail' : '⚠ Needs Attention'}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Add remarks (optional)..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              style={{
                width: '100%', marginTop: 12,
                background: '#07080f',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, padding: '12px 14px',
                color: '#f0eeff', fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                resize: 'none', outline: 'none',
                minHeight: 80
              }}
            />
          </div>
        )}

        {/* STEP 2: File Tree */}
        {currentStep === 1 && (
          <div>
            <div style={{marginBottom: 24}}>
              <h2 style={{
                fontFamily: 'Geist, sans-serif',
                fontSize: 20, fontWeight: 700, marginBottom: 8
              }}>Select Files for QR Codes</h2>
              <p style={{color: '#9896b8', fontSize: 14}}>
                Pick which files get their own QR code. 
                Each selected file = one scannable QR.
              </p>
            </div>

            <div style={{
              display: 'flex', gap: 8, marginBottom: 16,
              alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, color: '#5e5c80'
              }}>
                {selectedPaths.size} of {totalFiles} files selected
              </span>
              <div style={{display: 'flex', gap: 8}}>
                <button onClick={selectAll} style={{
                  background: 'rgba(108,99,255,0.1)',
                  border: '1px solid rgba(108,99,255,0.2)',
                  color: '#a89cff', padding: '6px 12px',
                  borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>Select All</button>
                <button onClick={deselectAll} style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#5e5c80', padding: '6px 12px',
                  borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>Clear</button>
              </div>
            </div>

            <FileTree 
              nodes={treeNodes}
              selectedPaths={selectedPaths}
              onToggle={handleToggleFile}
            />
          </div>
        )}

        {/* STEP 3: Settings */}
        {currentStep === 2 && (
          <div>
            <div style={{marginBottom: 32}}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, color: '#5e5c80',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 16
              }}>QR Code Expiry</p>
              
              <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16}}>
                {(
                  [
                    {label: '30 Days', value: '30d'},
                    {label: '90 Days', value: '90d'},
                    {label: '1 Year', value: '1y'},
                    {label: 'Never', value: 'never'}
                  ] as const
                ).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setExpiryPreset(opt.value)}
                    style={{
                      padding: '10px 20px', borderRadius: 8,
                      border: `1px solid ${expiryPreset === opt.value 
                        ? 'rgba(108,99,255,0.4)' 
                        : 'rgba(255,255,255,0.07)'}`,
                      background: expiryPreset === opt.value 
                        ? 'rgba(108,99,255,0.1)' 
                        : 'transparent',
                      color: expiryPreset === opt.value ? '#a89cff' : '#5e5c80',
                      fontSize: 13, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 150ms ease'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {expiryDate && (
                <p style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12, color: '#5e5c80'
                }}>
                  This QR will stop working on {new Date(expiryDate).toDateString()}
                </p>
              )}
            </div>

            <div style={{
              background: '#0d0f1a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: 20
            }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{fontSize: 15, fontWeight: 500, marginBottom: 4}}>
                    PIN Protection
                  </p>
                  <p style={{fontSize: 13, color: '#5e5c80'}}>
                    Require a 4-digit code to access this QR
                  </p>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={requirePin}
                    onChange={e => { setRequirePin(e.target.checked); setPin('') }} />
                  <span className="toggle-slider" />
                </label>
              </div>
              
              {requirePin && (
                <div style={{marginTop: 16}}>
                  <input
                    type="text" maxLength={4}
                    placeholder="0000"
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))}
                    style={{
                      background: '#07080f',
                      border: '1px solid rgba(108,99,255,0.3)',
                      borderRadius: 8, padding: '12px 16px',
                      color: '#f0eeff', fontSize: 24,
                      fontFamily: 'JetBrains Mono, monospace',
                      letterSpacing: '0.4em', textAlign: 'center',
                      width: 160, outline: 'none'
                    }}
                  />
                  {pin.length > 0 && pin.length < 4 && (
                    <p style={{ color: 'var(--warning)', fontSize: '0.8125rem', marginTop: 8 }}>
                      {4 - pin.length} more digit{4 - pin.length !== 1 ? 's' : ''} needed
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Generate */}
        {currentStep === 3 && (
          <div>
            {generatedQRs.length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px 0'}}>
                <div style={{
                  width: 100, height: 100,
                  background: 'rgba(108,99,255,0.1)',
                  border: '1px solid rgba(108,99,255,0.2)',
                  borderRadius: 24, margin: '0 auto 32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(108,99,255,0.2)'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" 
                    stroke="#a89cff" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                    <rect x="14" y="14" width="3" height="3"/>
                  </svg>
                </div>

                <h2 style={{
                  fontFamily: 'Geist, sans-serif',
                  fontSize: 28, fontWeight: 700,
                  marginBottom: 8, letterSpacing: '-0.02em'
                }}>Ready to Generate</h2>
                
                <p style={{color: '#9896b8', fontSize: 15, marginBottom: 40}}>
                  {selectedFiles.size || uploadedFiles.length} QR code
                  {(selectedFiles.size || uploadedFiles.length) !== 1 ? 's' : ''} will be created
                </p>

                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 12, maxWidth: 480, margin: '0 auto 40px', textAlign: 'left'
                }}>
                  {[
                    { 
                      label: 'Status', 
                      value: reportStatus === 'pass' ? '✓ Pass' 
                        : reportStatus === 'fail' ? '✕ Fail' 
                        : '⚠ Needs Attention',
                      color: reportStatus === 'pass' ? '#3dffa0' 
                        : reportStatus === 'fail' ? '#ff5a5a' 
                        : '#f0c060'
                    },
                    { 
                      label: 'Expires', 
                      value: expiryDate 
                        ? new Date(expiryDate).toLocaleDateString() 
                        : 'Never',
                      color: '#f0eeff'
                    },
                    { 
                      label: 'PIN Protected', 
                      value: requirePin ? 'Yes' : 'No',
                      color: requirePin ? '#a89cff' : '#5e5c80'
                    },
                    { 
                      label: 'Files', 
                      value: `${selectedFiles.size || uploadedFiles.length} file${(selectedFiles.size || uploadedFiles.length) !== 1 ? 's' : ''}`,
                      color: '#f0eeff'
                    },
                  ].map(item => (
                    <div key={item.label} style={{
                      background: '#0d0f1a',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10, padding: '14px 16px'
                    }}>
                      <p style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10, color: '#5e5c80',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        marginBottom: 6
                      }}>{item.label}</p>
                      <p style={{
                        fontSize: 15, fontWeight: 500,
                        color: item.color
                      }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {generateError && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 16px', maxWidth: 480, margin: '0 auto 24px',
                    background: 'rgba(255,90,90,0.08)',
                    border: '1px solid rgba(255,90,90,0.2)',
                    borderRadius: 8, textAlign: 'left'
                  }}>
                    <IconAlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>{generateError}</span>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  style={{
                    width: '100%', maxWidth: 480,
                    padding: '18px', borderRadius: 10,
                    background: generating ? '#3a3670' : '#6c63ff',
                    color: 'white', border: 'none',
                    fontSize: 16, fontWeight: 600,
                    fontFamily: 'Geist, sans-serif',
                    cursor: generating ? 'not-allowed' : 'pointer',
                    transition: 'all 200ms ease',
                    boxShadow: generating ? 'none' : '0 0 32px rgba(108,99,255,0.4)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 12,
                    margin: '0 auto'
                  }}
                >
                  {generating ? (
                    <>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        animation: 'spin 600ms linear infinite'
                      }} />
                      Generating... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" 
                        fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7"/>
                        <rect x="14" y="3" width="7" height="7"/>
                        <rect x="3" y="14" width="7" height="7"/>
                        <rect x="14" y="14" width="3" height="3"/>
                      </svg>
                      Generate QR Codes
                    </>
                  )}
                </button>

                {generating && (
                  <div style={{
                    maxWidth: 480, margin: '16px auto 0',
                    height: 4, background: 'rgba(255,255,255,0.05)',
                    borderRadius: 2, overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%', background: '#6c63ff',
                      borderRadius: 2, width: `${uploadProgress}%`,
                      transition: 'width 300ms ease',
                      boxShadow: '0 0 8px rgba(108,99,255,0.6)'
                    }} />
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div>
                    <h2 className="font-geist" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>
                      ✓ QR Codes Generated!
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {generatedQRs.length} QR code{generatedQRs.length !== 1 ? 's' : ''} ready to print and stick
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link
                      href={`/dashboard/projects/${projectId}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View Project
                    </Link>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 16
                }}>
                  {generatedQRs.map((qr) => (
                    <div key={qr.qrUniqueId} style={{
                      background: '#0d0f1a',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 12, padding: 24,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 16,
                      transition: 'border-color 200ms ease'
                    }}>
                      <div style={{
                        background: 'white', padding: 12,
                        borderRadius: 8
                      }}>
                        <QRCodeSVG 
                          value={`${window.location.origin}/scan/${qr.qrUniqueId}`}
                          size={160}
                        />
                      </div>

                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 11, fontWeight: 700,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '4px 12px', borderRadius: 20,
                        background: qr.status === 'pass' ? 'rgba(61,255,160,0.1)'
                          : qr.status === 'fail' ? 'rgba(255,90,90,0.1)'
                          : 'rgba(240,192,96,0.1)',
                        color: qr.status === 'pass' ? '#3dffa0'
                          : qr.status === 'fail' ? '#ff5a5a'
                          : '#f0c060',
                        border: `1px solid ${qr.status === 'pass' ? 'rgba(61,255,160,0.2)'
                          : qr.status === 'fail' ? 'rgba(255,90,90,0.2)'
                          : 'rgba(240,192,96,0.2)'}`
                      }}>
                        {qr.status === 'pass' ? '✓ Pass' 
                          : qr.status === 'fail' ? '✕ Fail' 
                          : '⚠ Needs Attention'}
                      </span>

                      <div style={{textAlign: 'center', width: '100%'}}>
                        <p style={{
                          fontFamily: 'Geist, sans-serif',
                          fontWeight: 600, fontSize: 14,
                          marginBottom: 4, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>{qr.fileName}</p>
                        <p style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 10, color: '#5e5c80', letterSpacing: '0.08em'
                        }}>ID: {qr.qrUniqueId}</p>
                      </div>

                      <div style={{
                        width: '100%', padding: '10px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 6, textAlign: 'center'
                      }}>
                        <p style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 10, color: '#5e5c80',
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          marginBottom: 4
                        }}>Expires</p>
                        <p style={{fontSize: 13, color: '#9896b8'}}>
                          {qr.expiryDate 
                            ? new Date(qr.expiryDate).toLocaleDateString()
                            : 'Never'}
                        </p>
                      </div>

                      <button style={{
                        width: '100%', padding: '10px',
                        background: 'rgba(108,99,255,0.1)',
                        border: '1px solid rgba(108,99,255,0.2)',
                        borderRadius: 8, color: '#a89cff',
                        fontSize: 13, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'all 150ms ease'
                      }}>
                        Download QR
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        {generatedQRs.length === 0 && (
          <div style={{ 
            display: 'flex', justifyContent: 'space-between', gap: 12,
            marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)'
          }}>
            {currentStep > 0 ? (
              <button onClick={goPrevStep} className="btn btn-secondary">
                <IconArrowLeft size={16} />
                Back
              </button>
            ) : <div />}

            {currentStep < STEPS.length - 1 && (
              <button
                onClick={goNextStep}
                disabled={!canProceed()}
                className="btn btn-primary"
              >
                Continue
                <IconArrowRight size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
