'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase'

import { uploadFile } from '@/lib/storage'
import { generateQRId, getExpiryFromPreset } from '@/lib/qr'
import FileTree, { TreeNode } from '@/components/upload/FileTree'
import Link from 'next/link'
import {
  IconUpload, IconCheck, IconArrowLeft, IconArrowRight,
  IconAlertCircle, IconDownload
} from '@tabler/icons-react'
import { QRCodeSVG } from 'qrcode.react'
import JSZip from 'jszip'
import type { QRLayout } from '@/components/pdf/QRLabelPDF'

const STEPS = ['Upload', 'Select Files', 'QR Expiry', 'QR Settings', 'Generate']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ACCEPTED_TYPES = ['.pdf', '.doc', '.docx', '.zip', '.rar', '.7z', '.tar', '.gz', '.war', '.ear']

interface GeneratedQR {
  qrUniqueId: string
  machineName: string
  fileName: string
  displayTitle: string
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
  
  // Step 1: Upload (includes optional status)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([])
  const [reportStatus, setReportStatus] = useState<'pass' | 'fail' | 'needs_attention' | null>(null)
  const [remarks, setRemarks] = useState('')
  
  // Step 2: Select Files
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [selectedFiles, setSelectedFiles] = useState<Map<string, File>>(new Map())
  const [customTitles, setCustomTitles] = useState<Map<string, string>>(new Map())
  const [totalFiles, setTotalFiles] = useState(0)
  
  // Step 3: Settings
  const [expiryPreset, setExpiryPreset] = useState<'30d' | '90d' | '1y' | 'never'>('90d')
  const [expiryDate, setExpiryDate] = useState<string | null>(getExpiryFromPreset('90d'))
  const [requirePin, setRequirePin] = useState(false)
  const [pin, setPin] = useState('')
  const [qrLayout, setQrLayout] = useState<QRLayout>(4)
  
  // Step 4: Generate
  const [generating, setGenerating] = useState(false)
  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([])
  const [generateError, setGenerateError] = useState('')
  const [projectName, setProjectName] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [exportingPDF, setExportingPDF] = useState(false)

  useEffect(() => {
    setExpiryDate(getExpiryFromPreset(expiryPreset))
  }, [expiryPreset])

  function svgToPngDataUrl(svg: SVGSVGElement): Promise<string> {
    return new Promise((resolve, reject) => {
      const markup = new XMLSerializer().serializeToString(svg)
      const serialized = markup.includes('xmlns=') ? markup : markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
      const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 1024
        canvas.height = 1024
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Unable to prepare QR image'))
          return
        }
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 64, 64, 896, 896)
        resolve(canvas.toDataURL('image/png'))
      }
      image.onerror = () => reject(new Error('Unable to render QR image'))
      image.src = source
    })
  }

  async function downloadBatchPDF() {
    setExportingPDF(true)
    try {
      const labels = await Promise.all(generatedQRs.map(async qr => {
        const svg = document.getElementById(`generated-qr-${qr.qrUniqueId}`)
        if (!(svg instanceof SVGSVGElement)) throw new Error(`QR ${qr.qrUniqueId} is not available`)
        return { ...qr, qrDataUrl: await svgToPngDataUrl(svg) }
      }))
      const [{ pdf }, { QRLabelPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/pdf/QRLabelPDF'),
      ])
      const blob = await pdf(<QRLabelPDF labels={labels} layout={qrLayout} />).toBlob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${projectName || 'project'}-QR-labels-${qrLayout}-up.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'PDF export failed')
    } finally {
      setExportingPDF(false)
    }
  }

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

  async function processFiles(files: File[]) {
    setProcessingFiles(true)
    setExtractionError('')
    
    try {
      const validFiles = files.filter(f => {
        const name = f.name.toLowerCase()
        return ACCEPTED_TYPES.some(ext => name.endsWith(ext)) && 
               f.size <= MAX_FILE_SIZE
      })

      if (validFiles.length === 0) return
      setUploadedFiles(validFiles)

      const allNodes: TreeNode[] = []

      for (const file of validFiles) {
        const name = file.name.toLowerCase()
        
        if (name.endsWith('.zip')) {
          try {
            const zip = await JSZip.loadAsync(file)
            const rootNodes: TreeNode[] = []
            const folderMap = new Map<string, TreeNode>()
            
            // Extract all files into Blobs immediately to attach as File objects
            const entries = Object.values(zip.files).filter(entry => !entry.dir)
            
            if (entries.length > 0) {
              const extractionPromises = entries.map(async (entry) => {
                const blob = await entry.async('blob')
                // Create a File object from the Blob so it behaves exactly like a normal file
                const extractedName = entry.name.split('/').pop() || 'file'
                const extractedFile = new File([blob], extractedName, { type: blob.type })
                
                const parts = entry.name.split('/')
                const fileName = parts[parts.length - 1]
                if (!fileName) return

                if (parts.length === 1) {
                  rootNodes.push({ 
                    name: fileName, path: entry.name, 
                    type: 'file', file: extractedFile 
                  })
                } else {
                  let parentList = rootNodes
                  let currentPath = ''
                  for (let i = 0; i < parts.length - 1; i++) {
                    currentPath = i === 0 
                      ? parts[i] 
                      : currentPath + '/' + parts[i]
                    let folder = folderMap.get(currentPath)
                    if (!folder) {
                      folder = { 
                        name: parts[i], path: currentPath, 
                        type: 'folder', children: [] 
                      }
                      folderMap.set(currentPath, folder)
                      parentList.push(folder)
                    }
                    parentList = folder.children!
                  }
                  parentList.push({ 
                    name: fileName, path: entry.name, 
                    type: 'file', file: extractedFile 
                  })
                }
              })
              
              await Promise.all(extractionPromises)
              
              allNodes.push({ 
                name: file.name, path: file.name, 
                type: 'folder', children: rootNodes 
              })
            } else {
              allNodes.push({ name: file.name, path: file.name, type: 'file', file })
            }
          } catch (err) {
            console.error('ZIP extraction error:', err)
            allNodes.push({ name: file.name, path: file.name, type: 'file', file })
          }
        } else if (
          name.endsWith('.rar') || 
          name.endsWith('.7z') || 
          name.endsWith('.tar') ||
          name.endsWith('.gz')
        ) {
          // RAR/7Z/TAR — upload as single file, show hint
          setExtractionError(
            `"${file.name}" is a ${name.split('.').pop()?.toUpperCase()} file. ` +
            `File tree preview is only available for ZIP files. ` +
            `The file will still be uploaded and QR generated correctly.`
          )
          allNodes.push({ 
            name: file.name, 
            path: file.name, 
            type: 'file', 
            file 
          })
        } else {
          // PDF, DOCX etc — single file
          allNodes.push({ 
            name: file.name, path: file.name, 
            type: 'file', file 
          })
        }
      }

      setTreeNodes(allNodes)
      
      // Auto advance logic
      if (!allNodes.some(n => n.type === 'folder')) {
        setCurrentStep(2) // Jump straight to Settings
      }
    } finally {
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

  function handleTitleChange(path: string, title: string) {
    const newTitles = new Map(customTitles)
    newTitles.set(path, title)
    setCustomTitles(newTitles)
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
          status: reportStatus || 'pass',
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

      for (const { file, path } of filesToProcess) {
        setUploadProgress(Math.round((processed / filesToProcess.length) * 90))

        let displayTitle = customTitles.get(path)?.trim() || ''
        if (!displayTitle) {
          // If no custom title, parse the path for nested files (e.g., Folder/Subfolder/file.pdf -> Folder / Subfolder / file.pdf)
          displayTitle = path.split('/').join(' / ')
        }

        const { path: storagePath, url, error: uploadErr } = await uploadFile(
          file, user.id, projectId, report.id
        )
        if (uploadErr) throw new Error(`Failed to upload ${file.name}: ${uploadErr}`)

        const { data: fileRecord, error: fileErr } = await supabase
          .from('files')
          .insert({
            report_id: report.id,
            file_name: displayTitle || file.name,
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
          fileName: displayTitle || file.name,
          displayTitle,
          status: reportStatus || 'pass',
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
    if (currentStep === 3) return !requirePin || pin.length === 4
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
    if (currentStep === 2 && !treeNodes.some(n => n.type === 'folder')) { setCurrentStep(0) } else if (currentStep === 3 && !treeNodes.some(n => n.type === 'folder')) { setCurrentStep(2) } else {
      setCurrentStep(s => s - 1)
    }
  }

  return (
    <div className="legacy-light-theme" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Link
        href={`/dashboard?project=${projectId}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem',
          marginBottom: 24, transition: 'color 150ms ease'
        }}
      >
        <IconArrowLeft size={16} />
        Back to Project
      </Link>

      <div className="mb-8 pt-0">
        <h1 className="font-[family-name:var(--font-instrument)] text-5xl text-[#1A1A1A] mb-4">
          Upload Files
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-[#1A1A1A]/50">
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

      <div className="animate-fade-up rounded-3xl border border-black/[0.05] bg-white/70 p-10 shadow-2xl backdrop-blur-3xl">

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
                color: 'var(--accent-light)'
              }}>
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid #6c63ff',
                  borderTopColor: 'transparent',
                  animation: 'spin 600ms linear infinite'
                }} />
                Extracting files...
              </div>
            )}

            {extractionError && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 16px',
                background: 'rgba(240,192,96,0.06)',
                border: '1px solid rgba(240,192,96,0.2)',
                borderRadius: 8, marginTop: 12
              }}>
                <span style={{color: '#f0c060', fontSize: 14, flexShrink: 0}}>⚠</span>
                <div>
                  <p style={{fontSize: 13, color: '#f0c060', marginBottom: 4}}>
                    {extractionError}
                  </p>
                  <p style={{fontSize: 12, color: 'var(--text-muted)'}}>
                    Tip: Convert to ZIP to see the full file tree and 
                    select individual files for separate QR codes.
                  </p>
                </div>
              </div>
            )}

            {uploadedFiles.length > 0 && !processingFiles && (
              <div className="animate-slide-down">
                <div style={{ marginTop: 24 }}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    marginBottom: 16 
                  }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      {selectedPaths.size} files selected
                    </span>
                    <button
                      onClick={deselectAll}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
                        textDecoration: 'underline'
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                  <FileTree 
                    nodes={treeNodes}
                    selectedPaths={selectedPaths}
                    customTitles={customTitles}
                    onToggle={handleToggleFile}
                    onTitleChange={handleTitleChange}
                  />
                </div>
              </div>
            )}

            <div style={{marginTop: 24}}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, color: 'var(--text-muted)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                marginBottom: 12
              }}>
                Inspection Status (optional)
              </p>
              <div style={{display: 'flex', gap: 8}}>
                {['Pass', 'Needs Attention', 'Fail'].map(s => {
                  const val = s.toLowerCase().replace(' ', '_') as 'pass' | 'fail' | 'needs_attention'
                  const isSelected = reportStatus === val
                  return (
                    <button
                      key={s}
                      onClick={() => setReportStatus(isSelected ? null : val)}
                      style={{
                        flex: 1, padding: '10px 8px',
                        borderRadius: 8,
                        border: `1px solid ${
                          isSelected
                            ? s === 'Pass' ? 'rgba(61,255,160,0.4)'
                            : s === 'Fail' ? 'rgba(255,90,90,0.4)'
                            : 'rgba(240,192,96,0.4)'
                            : 'rgba(255,255,255,0.07)'
                        }`,
                        background: isSelected
                          ? s === 'Pass' ? 'rgba(61,255,160,0.08)'
                          : s === 'Fail' ? 'rgba(255,90,90,0.08)'
                          : 'rgba(240,192,96,0.08)'
                          : 'transparent',
                        color: isSelected
                          ? s === 'Pass' ? '#3dffa0'
                          : s === 'Fail' ? '#ff5a5a'
                          : '#f0c060'
                          : 'var(--text-muted)',
                        fontSize: 13, fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      {s === 'Pass' ? '✓ Pass' : s === 'Fail' ? '✕ Fail' : '⚠ Needs Attention'}
                    </button>
                  )
                })}
              </div>
            </div>

            <textarea
              placeholder="Add remarks (optional)..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              style={{
                width: '100%', marginTop: 12,
                background: 'var(--bg-card)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, padding: '12px 14px',
                color: 'var(--text-primary)', fontSize: 13,
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
              <p style={{color: 'var(--text-secondary)', fontSize: 14}}>
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
                fontSize: 11, color: 'var(--text-muted)'
              }}>
                {selectedPaths.size} of {totalFiles} files selected
              </span>
              <div style={{display: 'flex', gap: 8}}>
                <button onClick={selectAll} style={{
                  background: 'rgba(108,99,255,0.1)',
                  border: '1px solid rgba(108,99,255,0.2)',
                  color: 'var(--accent-light)', padding: '6px 12px',
                  borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>Select All</button>
                <button onClick={deselectAll} style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'var(--text-muted)', padding: '6px 12px',
                  borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif'
                }}>Clear</button>
              </div>
            </div>

            <FileTree 
              nodes={treeNodes}
              selectedPaths={selectedPaths}
              customTitles={customTitles}
              onToggle={handleToggleFile}
              onTitleChange={handleTitleChange}
            />

            <button
              onClick={() => setCurrentStep(2)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                marginTop: 16,
                textDecoration: 'underline'
              }}
            >
              Skip — upload all files without selecting
            </button>
          </div>
        )}

        {/* STEP 3: QR Expiry */}
        {currentStep === 2 && (
          <div>
            <div style={{marginBottom: 32}}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, color: 'var(--text-muted)',
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
                      color: expiryPreset === opt.value ? 'var(--accent-light)' : 'var(--text-muted)',
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
                  fontSize: 12, color: 'var(--text-muted)'
                }}>
                  This QR will stop working on {new Date(expiryDate).toDateString()}
                </p>
              )}
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: 20,
              marginTop: 32
            }}>
            </div></div>)}
            {/* STEP 4: QR Settings */}
            {currentStep === 3 && (
              <div>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 12, padding: 20
                }}>
                  <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>QR Layout</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Choose how many labels are placed on each A4 PDF page.</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(72px, 1fr))', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                {([1, 2, 4, 6, 9] as QRLayout[]).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setQrLayout(option)}
                    aria-pressed={qrLayout === option}
                    style={{
                      minWidth: 72,
                      padding: '12px 8px',
                      borderRadius: 8,
                      border: `1px solid ${qrLayout === option ? 'rgba(108,99,255,0.55)' : 'rgba(255,255,255,0.08)'}`,
                      background: qrLayout === option ? 'rgba(108,99,255,0.13)' : 'var(--bg-card)',
                      color: qrLayout === option ? '#c1bbff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontFamily: 'JetBrains Mono, monospace'
                    }}
                  >
                    <span style={{ display: 'block', fontSize: 18, fontWeight: 700, marginBottom: 3 }}>{option}</span>
                    <span style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>per page</span>
                  </button>
                ))}
              </div>
              <p style={{ marginTop: 12, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                {qrLayout === 1 ? 'Largest label - best for machine panels' : qrLayout <= 4 ? 'Standard label size - clear at arm\'s length' : 'Compact labels - best for document folders'}
              </p>
            </div>

            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12, padding: 20,
              marginTop: 20
            }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{fontSize: 15, fontWeight: 500, marginBottom: 4}}>
                    PIN Protection
                  </p>
                  <p style={{fontSize: 13, color: 'var(--text-muted)'}}>
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
                      background: 'var(--bg-card)',
                      border: '1px solid rgba(108,99,255,0.3)',
                      borderRadius: 8, padding: '12px 16px',
                      color: 'var(--text-primary)', fontSize: 24,
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

        {/* STEP 5: Generate */}
        {currentStep === 4 && (
          <div className="animate-fade-up">
            {generatedQRs.length === 0 && !generating && !generateError ? (
              <div style={{textAlign: 'center', padding: '40px 0'}}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 24px'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                    <rect x="14" y="14" width="3" height="3"/>
                  </svg>
                </div>
                <h2 className="font-geist" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>Ready to Generate</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                  {selectedFiles.size || uploadedFiles.length} QR code{(selectedFiles.size || uploadedFiles.length) !== 1 ? 's' : ''} will be created · {qrLayout} per PDF page
                </p>
                <button
                  onClick={handleGenerate}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', maxWidth: 300, margin: '0 auto', display: 'flex', justifyContent: 'center' }}
                >
                  Generate QR Codes
                </button>
              </div>
            ) : generating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  border: '3px solid rgba(108,99,255,0.2)',
                  borderTopColor: 'var(--accent)',
                  animation: 'spin 1s linear infinite',
                  marginBottom: 24
                }} />
                <h2 className="font-geist" style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: 8 }}>
                  Generating QR Codes...
                </h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                  Uploading files and creating secure links
                </p>
                <div style={{ width: '100%', maxWidth: 300, background: 'var(--bg-base)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: 'var(--accent)',
                    width: `${uploadProgress}%`, transition: 'width 200ms ease'
                  }} />
                </div>
              </div>
            ) : generateError ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,90,90,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <IconAlertCircle color="var(--danger)" size={24} />
                </div>
                <h3 style={{ color: 'var(--danger)', marginBottom: 8 }}>Generation Failed</h3>
                <p style={{ color: 'var(--text-secondary)' }}>{generateError}</p>
                <button 
                  className="btn btn-secondary" 
                  style={{ marginTop: 24 }}
                  onClick={() => setGenerating(false)}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="print-container">
                <div className="no-print" style={{ textAlign: 'center', marginBottom: 40 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(61,255,160,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}>
                    <IconCheck size={28} color="var(--success)" />
                  </div>
                  <h2 className="font-geist" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
                    Success! {generatedQRs.length} QR Code{generatedQRs.length === 1 ? '' : 's'} Generated
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
                    Your files are safely uploaded and ready to scan.
                  </p>
                  
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      onClick={downloadBatchPDF}
                      disabled={exportingPDF}
                    >
                      <IconDownload size={16} />
                      {exportingPDF ? 'Preparing PDF...' : `Download PDF · ${qrLayout} per page`}
                    </button>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 24
                }}>
                  {generatedQRs.map((qr, i) => {
                    const scanUrl = `${window.location.origin}/scan/${qr.qrUniqueId}`
                    
                    return (
                      <div key={i} className="card print-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        
                        <div style={{ marginBottom: 16, textAlign: 'center', width: '100%' }}>
                          <h4 style={{ 
                            fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)',
                            marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }} title={qr.displayTitle}>
                            {qr.displayTitle}
                          </h4>
                          <div style={{ 
                            fontFamily: 'JetBrains Mono, monospace', fontSize: '0.7rem', color: 'var(--text-muted)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {qr.fileName}
                          </div>
                        </div>

                        <div style={{
                          background: 'white',
                          padding: 16,
                          borderRadius: 12,
                          marginBottom: 20
                        }}>
                          <QRCodeSVG
                            id={`generated-qr-${qr.qrUniqueId}`}
                            value={scanUrl}
                            size={160}
                            level="H"
                            includeMargin={false}
                          />
                        </div>

                        <div style={{
                          width: '100%',
                          padding: '12px',
                          background: 'var(--bg-base)',
                          borderRadius: 8,
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span>ID:</span>
                            <span style={{ color: 'var(--text-primary)' }}>{qr.qrUniqueId}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Machine:</span>
                            <span style={{ color: 'var(--text-primary)' }}>{qr.machineName}</span>
                          </div>
                        </div>

                        <div className="no-print" style={{ display: 'flex', gap: 8, marginTop: 16, width: '100%' }}>
                          <button 
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}
                            onClick={() => {
                              navigator.clipboard.writeText(scanUrl)
                            }}
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="no-print" style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                  <Link href={`/dashboard?project=${projectId}`} className="btn btn-primary" style={{
                    background: '#1A1A1A', color: 'white', border: 'none',
                    padding: '16px 32px', borderRadius: '12px', fontSize: '14px',
                    fontWeight: 600, fontFamily: 'Inter, sans-serif'
                  }}>
                    Return to Project Dashboard
                  </Link>
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
