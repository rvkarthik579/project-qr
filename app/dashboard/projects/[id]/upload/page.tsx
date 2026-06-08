'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { uploadFile } from '@/lib/storage'
import { generateQRId, getExpiryFromPreset } from '@/lib/qr'
import FileTree, { TreeNode } from '@/components/upload/FileTree'
import ExpiryPicker from '@/components/upload/ExpiryPicker'
import QRCard from '@/components/upload/QRCard'
import Link from 'next/link'
import {
  IconUpload, IconCheck, IconArrowLeft, IconArrowRight,
  IconShield, IconLock, IconQrcode,
  IconAlertCircle, IconX
} from '@tabler/icons-react'

const STEPS = ['Upload Files', 'Report Details', 'Expiry', 'Security', 'Generate']
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ACCEPTED_TYPES = ['.zip', '.rar', '.ear', '.war', '.pdf', '.docx', '.doc']

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
  
  // Step 1: Files
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [treeNodes, setTreeNodes] = useState<TreeNode[]>([])
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [selectedFiles, setSelectedFiles] = useState<Map<string, File>>(new Map())
  
  // Step 2: Report
  const [reportStatus, setReportStatus] = useState<'pass' | 'fail' | 'needs_attention'>('pass')
  const [remarks, setRemarks] = useState('')
  const [nextInspectionDate, setNextInspectionDate] = useState('')
  
  // Step 3: Expiry
  const [expiryDate, setExpiryDate] = useState<string | null>(getExpiryFromPreset('90d'))
  
  // Step 4: Security
  const [requirePin, setRequirePin] = useState(false)
  const [pin, setPin] = useState('')
  const [showCompany, setShowCompany] = useState(true)
  const [showUploaderName, setShowUploaderName] = useState(true)
  const [showNextInspection, setShowNextInspection] = useState(true)
  
  // Step 5: Generated QRs
  const [generating, setGenerating] = useState(false)
  const [generatedQRs, setGeneratedQRs] = useState<GeneratedQR[]>([])
  const [generateError, setGenerateError] = useState('')
  const [projectName, setProjectName] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  // Build file tree from a zip
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

    // Extract ALL files in parallel instead of sequentially
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

  async function processFiles(files: File[]) {
    setProcessingFiles(true)
    try {
      const validFiles = files.filter(f => {
        const ext = '.' + f.name.split('.').pop()?.toLowerCase()
        return ACCEPTED_TYPES.includes(ext) && f.size <= MAX_FILE_SIZE
      })

      if (validFiles.length === 0) return
      setUploadedFiles(validFiles)

      const allNodes: TreeNode[] = []
      for (const file of validFiles) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        if (ext === '.zip') {
          const zipNodes = await buildTreeFromZip(file)
          allNodes.push({ name: file.name, path: file.name, type: 'folder', children: zipNodes })
        } else {
          allNodes.push({ name: file.name, path: file.name, type: 'file', file })
        }
      }
      setTreeNodes(allNodes)
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

  // Load project name
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

      // Fetch project name if not loaded
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
          next_inspection_date: nextInspectionDate || null,
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

        // Upload file to storage
        const { path: storagePath, url, error: uploadErr } = await uploadFile(
          file, user.id, projectId, report.id
        )
        if (uploadErr) throw new Error(`Failed to upload ${file.name}: ${uploadErr}`)

        // Create file record
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

        // Generate QR ID
        const qrUniqueId = generateQRId()

        // Hash PIN if required
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

        // Create QR record
        const { error: qrErr } = await supabase
          .from('qr_codes')
          .insert({
            file_id: fileRecord.id,
            report_id: report.id,
            user_id: user.id,
            qr_unique_id: qrUniqueId,
            password_hash: passwordHash,
            expiry_date: expiryDate,
            next_inspection_date: nextInspectionDate || null,
            show_company: showCompany,
            show_uploader_name: showUploaderName,
            show_next_inspection: showNextInspection,
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
    if (currentStep === 3) return !requirePin || pin.length === 4
    return true
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Back */}
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
        <h1 className="font-syne" style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: 8 }}>
          Upload Inspection Report
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Upload files, create a report, and generate QR codes
        </p>
      </div>

      {/* Step Indicator */}
      <div className="step-indicator" style={{ marginBottom: 32, overflowX: 'auto' }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={`step ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}`}
              onClick={() => i < currentStep && setCurrentStep(i)}
              style={{ cursor: i < currentStep ? 'pointer' : 'default' }}
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

      {/* Step Content */}
      <div className="card animate-fade-up" style={{ padding: 32 }}>

        {/* STEP 1: Upload */}
        {currentStep === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 className="font-syne" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                Upload Files
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Drag & drop ZIP, RAR, EAR, WAR, PDF, or DOCX files. Max 50MB. ZIP files will be expanded automatically.
              </p>
            </div>

            {/* Drop zone */}
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
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ZIP · RAR · EAR · WAR · PDF · DOCX — max 50MB
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".zip,.rar,.ear,.war,.pdf,.docx,.doc"
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
                fontFamily: 'DM Mono, monospace',
                fontSize: '0.8125rem',
                color: 'var(--accent-light)'
              }}>
                <div className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%' }} />
                Extracting files from ZIP...
              </div>
            )}

            {/* Uploaded files list */}
            {uploadedFiles.length > 0 && (
              <div>
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                  color: 'var(--text-secondary)', fontSize: '0.875rem'
                }}>
                  <IconCheck size={14} color="var(--success)" />
                  <span>{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded</span>
                </div>
                
                {/* File tree for zip contents */}
                {treeNodes.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                      Select files to generate individual QR codes (or skip to generate one QR per upload):
                    </p>
                    <FileTree 
                      nodes={treeNodes}
                      selectedPaths={selectedPaths}
                      onToggle={handleToggleFile}
                    />
                  </div>
                )}

                <button
                  onClick={() => { setUploadedFiles([]); setTreeNodes([]); setSelectedPaths(new Set()); setSelectedFiles(new Map()) }}
                  style={{ 
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '0.8125rem',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <IconX size={14} />
                  Clear files
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Report Details */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <h2 className="font-syne" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
              Inspection Report Details
            </h2>

            {/* Status */}
            <div>
              <label className="label">Inspection Status *</label>
              <div style={{ display: 'flex', gap: 12 }}>
                {([
                  { value: 'pass', label: '✓ Pass', color: 'var(--success)', bg: 'rgba(61,255,160,0.1)', border: 'rgba(61,255,160,0.3)' },
                  { value: 'needs_attention', label: '⚠ Needs Attention', color: 'var(--warning)', bg: 'rgba(240,192,96,0.1)', border: 'rgba(240,192,96,0.3)' },
                  { value: 'fail', label: '✕ Fail', color: 'var(--danger)', bg: 'rgba(255,90,90,0.1)', border: 'rgba(255,90,90,0.3)' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReportStatus(opt.value)}
                    style={{
                      flex: 1,
                      padding: '16px 8px',
                      borderRadius: 10,
                      border: `2px solid ${reportStatus === opt.value ? opt.border : 'var(--border)'}`,
                      background: reportStatus === opt.value ? opt.bg : 'transparent',
                      color: reportStatus === opt.value ? opt.color : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      fontFamily: 'Inter, sans-serif',
                      transition: 'all 150ms ease',
                      textAlign: 'center',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="label">Remarks</label>
              <textarea
                className="textarea"
                placeholder="Describe the inspection findings, notes for next inspector, issues found..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={4}
              />
            </div>

            {/* Next inspection */}
            <div>
              <label className="label">Next Inspection Date</label>
              <input
                type="date"
                className="input"
                value={nextInspectionDate}
                onChange={e => setNextInspectionDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        )}

        {/* STEP 3: Expiry */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 className="font-syne" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                QR Code Expiry
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Set when the QR code stops working. After expiry, scans are blocked and logged.
              </p>
            </div>
            <ExpiryPicker value={expiryDate} onChange={setExpiryDate} />
          </div>
        )}

        {/* STEP 4: Security */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 className="font-syne" style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>
                Security & Label Settings
              </h2>
            </div>

            {/* PIN */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: requirePin ? 16 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36,
                    background: requirePin ? 'rgba(108,99,255,0.1)' : 'rgba(255,255,255,0.05)',
                    borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <IconLock size={18} color={requirePin ? 'var(--accent-light)' : 'var(--text-muted)'} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Require PIN</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Scanner must enter a 4-digit PIN</div>
                  </div>
                </div>
                <label className="toggle">
                  <input 
                    type="checkbox" 
                    checked={requirePin}
                    onChange={e => { setRequirePin(e.target.checked); setPin('') }}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>
              {requirePin && (
                <div className="animate-slide-down">
                  <label className="label">Enter 4-digit PIN</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="0000"
                    maxLength={4}
                    value={pin}
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    style={{ fontFamily: 'DM Mono, monospace', fontSize: '1.25rem', letterSpacing: '0.3em', maxWidth: 160 }}
                  />
                  {pin.length > 0 && pin.length < 4 && (
                    <p style={{ color: 'var(--warning)', fontSize: '0.8125rem', marginTop: 8 }}>
                      {4 - pin.length} more digit{4 - pin.length !== 1 ? 's' : ''} needed
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Label settings */}
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconShield size={18} color="var(--text-muted)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Label Information</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Choose what's visible on the printed QR label</div>
                </div>
              </div>

              {[
                { label: 'Show company name', checked: showCompany, onChange: setShowCompany },
                { label: 'Show uploader name', checked: showUploaderName, onChange: setShowUploaderName },
                { label: 'Show next inspection date', checked: showNextInspection, onChange: setShowNextInspection },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                  <label className="toggle">
                    <input type="checkbox" checked={item.checked} onChange={e => item.onChange(e.target.checked)} />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Generate */}
        {currentStep === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {generatedQRs.length === 0 ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{
                    width: 80, height: 80,
                    background: 'rgba(108,99,255,0.1)',
                    border: '1px solid rgba(108,99,255,0.2)',
                    borderRadius: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px'
                  }}>
                    <IconQrcode size={36} color="var(--accent-light)" />
                  </div>
                  <h2 className="font-syne" style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 8 }}>
                    Ready to Generate
                  </h2>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    {selectedFiles.size > 0 
                      ? `Generate ${selectedFiles.size} QR code${selectedFiles.size !== 1 ? 's' : ''} for selected files`
                      : `Generate ${uploadedFiles.length} QR code${uploadedFiles.length !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>

                {/* Summary */}
                <div style={{
                  background: 'var(--bg-hover)', borderRadius: 10,
                  padding: 16, marginBottom: 24, textAlign: 'left'
                }}>
                  {[
                    { label: 'Status', value: reportStatus.replace('_', ' ').toUpperCase() },
                    { label: 'Expiry', value: expiryDate ? new Date(expiryDate).toLocaleDateString() : 'Never' },
                    { label: 'PIN Protected', value: requirePin ? `Yes (${pin})` : 'No' },
                    { label: 'Files', value: `${selectedFiles.size || uploadedFiles.length}` },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</span>
                      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {generateError && (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 16px',
                    background: 'rgba(255,90,90,0.08)',
                    border: '1px solid rgba(255,90,90,0.2)',
                    borderRadius: 8, marginBottom: 16, textAlign: 'left'
                  }}>
                    <IconAlertCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>{generateError}</span>
                  </div>
                )}

                {generating && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ 
                      height: 4, background: 'var(--bg-hover)', borderRadius: 2,
                      overflow: 'hidden', marginBottom: 8
                    }}>
                      <div style={{
                        height: '100%', background: 'var(--accent)',
                        borderRadius: 2, width: `${uploadProgress}%`,
                        transition: 'width 300ms ease'
                      }} />
                    </div>
                    <p style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Uploading files and generating QR codes... {uploadProgress}%
                    </p>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn btn-primary btn-lg animate-glow"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '1rem' }}
                >
                  <IconQrcode size={20} />
                  {generating ? `Generating... ${uploadProgress}%` : 'Generate QR Codes'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <div>
                    <h2 className="font-syne" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>
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
                  {generatedQRs.map((qr, i) => (
                    <QRCard
                      key={qr.qrUniqueId}
                      qrUniqueId={qr.qrUniqueId}
                      machineName={qr.machineName}
                      fileName={qr.fileName}
                      status={qr.status}
                      expiryDate={qr.expiryDate}
                      generatedDate={qr.generatedDate}
                      animationDelay={i * 80}
                    />
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
              <button onClick={() => setCurrentStep(s => s - 1)} className="btn btn-secondary">
                <IconArrowLeft size={16} />
                Back
              </button>
            ) : <div />}

            {currentStep < STEPS.length - 1 && (
              <button
                onClick={() => setCurrentStep(s => s + 1)}
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
