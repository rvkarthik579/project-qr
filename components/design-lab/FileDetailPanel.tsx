"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  RotateCw,
  Trash2,
  QrCode,
  TrendingUp,
  Loader2,
  Link2,
  ExternalLink,
  Eye,
  Edit2,
  Calendar,
  Check,
  X as XIcon,
  Shield,
  Key
} from "lucide-react";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";
import type { DesignLabFile } from "@/components/design-lab/types";
import { QRCodeSVG } from "qrcode.react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useBackButton } from "@/hooks/useBackButton";

interface FileDetailPanelProps {
  file: DesignLabFile;
  onClose: () => void;
  onDelete?: () => void; // Added callback to refresh parent
}

export default function FileDetailPanel({ file, onClose, onDelete }: FileDetailPanelProps) {
  const { triggerRipple } = useCanvasEffect();
  const maxTrend = Math.max(...file.scanTrend, 1);
  
  // Intercept back button to close this panel instead of navigating away
  useBackButton(true, onClose);

  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [copiedQR, setCopiedQR] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localFile, setLocalFile] = useState<DesignLabFile>(file);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(file.name);
  const [isEditingExpiry, setIsEditingExpiry] = useState(false);
  const [newExpiry, setNewExpiry] = useState('');
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  const handleUpdatePin = async (pinValue: string | null) => {
    if (!localFile.qrUniqueId) return;
    setIsSavingPin(true);
    try {
      const supabase = getSupabaseBrowserClient();
      let hashToSave = null;
      
      if (pinValue) {
        if (!/^\d{4}$/.test(pinValue)) {
          alert('PIN must be exactly 4 digits');
          setIsSavingPin(false);
          return;
        }
        const res = await fetch('/api/qr/hash-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: pinValue })
        });
        if (!res.ok) throw new Error('Failed to hash PIN');
        const data = await res.json();
        hashToSave = data.hash;
      }
      
      await supabase.from('qr_codes').update({ password_hash: hashToSave }).eq('qr_unique_id', localFile.qrUniqueId);
      setLocalFile(prev => ({ ...prev, requiresPin: !!hashToSave }));
      if (onDelete) onDelete(); // Refresh parent
    } catch (e) {
      console.error(e);
      alert('Failed to update PIN');
    }
    setIsSavingPin(false);
    setIsEditingPin(false);
    setNewPin('');
  };

  useEffect(() => {
    setLocalFile(file);
    setNewName(file.name);
  }, [file]);

  const handleRename = async () => {
    if (!newName.trim() || newName === localFile.name) {
      setIsRenaming(false);
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.from('files').update({ file_name: newName }).eq('id', localFile.id);
      setLocalFile(prev => ({ ...prev, name: newName }));
      if (onDelete) onDelete(); // Refresh parent
    } catch (e) {
      console.error(e);
      alert('Failed to rename file');
    }
    setIsRenaming(false);
  };

  const handleUpdateExpiry = async (dateStr: string) => {
    if (!localFile.qrUniqueId) return;
    try {
      const supabase = getSupabaseBrowserClient();
      const newDate = new Date(dateStr);
      await supabase.from('qr_codes').update({ expiry_date: newDate.toISOString() }).eq('qr_unique_id', localFile.qrUniqueId);
      
      const newExpiryFormatted = newDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
      let newStatus = localFile.status;
      if (localFile.status !== 'Revoked' && localFile.status !== 'Needs Attention') {
        const diff = newDate.getTime() - new Date().getTime();
        if (diff < 0) newStatus = 'Expired';
        else if (diff < 7 * 24 * 60 * 60 * 1000) newStatus = 'Expiring Soon';
        else newStatus = 'Active';
      }
      
      setLocalFile(prev => ({ ...prev, expiryDate: newExpiryFormatted, status: newStatus as any }));
      if (onDelete) onDelete(); // Refresh parent
    } catch (e) {
      console.error(e);
      alert('Failed to update expiry');
    }
    setIsEditingExpiry(false);
  };

  const handleExtend30Days = async () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    await handleUpdateExpiry(d.toISOString());
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this file and its QR codes?')) return;
    setIsDeleting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (file.filePath) {
        await supabase.storage.from('project-qr-files').remove([file.filePath]);
      }
      const { error } = await supabase.from('files').delete().eq('id', file.id);
      if (error) throw error;
      
      onClose();
      if (onDelete) {
        onDelete();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to delete', err);
      alert('Failed to delete file');
      setIsDeleting(false);
    }
  };

  const downloadQR = () => {
    triggerRipple("#4A90E2");
    if (!file.qrUniqueId) return;

    const svg = document.getElementById(`detail-qr-${file.qrUniqueId}`);
    if (!(svg instanceof SVGSVGElement)) return;

    const markup = new XMLSerializer().serializeToString(svg);
    const serialized = markup.includes('xmlns=') ? markup : markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const source = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 64, 64, 896, 896);
      const anchor = document.createElement('a');
      anchor.download = `${file.name.replace(/[^a-z0-9._-]+/gi, '-')}-QR.png`;
      anchor.href = canvas.toDataURL('image/png');
      anchor.click();
    };
    image.src = source;
  };

  const handleFileAction = async (action: 'download' | 'copy' | 'open' | 'preview') => {
    if (!file.filePath) return;
    setIsDownloadingFile(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.storage
        .from('project-qr-files')
        .createSignedUrl(file.filePath, 300, action === 'download' ? { download: file.name } : undefined);
      
      if (error || !data) throw error;
      
      if (action === 'open' || action === 'preview') {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'docx' || ext === 'doc') {
          const encodedUrl = encodeURIComponent(data.signedUrl);
          window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`, '_blank');
        } else {
          window.open(data.signedUrl, '_blank');
        }
      } else if (action === 'copy') {
        await navigator.clipboard.writeText(data.signedUrl);
        setCopiedQR(file.filePath);
        setTimeout(() => setCopiedQR(null), 2000);
      } else if (action === 'download') {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Failed to perform action", err);
      alert("Failed to perform action on file");
    } finally {
      setIsDownloadingFile(false);
    }
  };

  function renderActions() {
    return (
    <div className="flex flex-col gap-3">
      <button 
        onClick={() => handleFileAction('preview')}
        disabled={isDownloadingFile || !file.filePath}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#6c63ff] py-4 lg:py-3.5 text-white shadow-lg shadow-[#6c63ff]/20 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 min-h-[56px]"
      >
        {isDownloadingFile ? <Loader2 className="h-5 w-5 animate-spin" /> : <Eye className="h-5 w-5" />}
        <span className="font-mono text-[12px] font-bold uppercase tracking-widest">
          Preview Report
        </span>
      </button>
      
      <button 
        onClick={() => handleFileAction('download')}
        disabled={isDownloadingFile || !file.filePath}
        className="flex items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] py-4 lg:py-3.5 text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 min-h-[56px]"
      >
        <Download className="h-5 w-5" />
        <span className="font-mono text-[12px] font-bold uppercase tracking-widest">
          Download File
        </span>
      </button>
      
      <div className="grid grid-cols-2 gap-3 mt-2">
        <button 
          onClick={() => handleFileAction('copy')}
          disabled={isDownloadingFile || !file.filePath}
          className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-3.5 text-black/80 transition-colors hover:bg-black/5 disabled:opacity-50 min-h-[56px]"
        >
          <Link2 className="h-4 w-4 text-black/50" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            {copiedQR === file.filePath ? "Copied!" : "Copy Link"}
          </span>
        </button>
        <button 
          onClick={() => handleFileAction('open')}
          disabled={isDownloadingFile || !file.filePath}
          className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-3.5 text-black/80 transition-colors hover:bg-black/5 disabled:opacity-50 min-h-[56px]"
        >
          <ExternalLink className="h-4 w-4 text-black/50" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            New Tab
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <button
          onClick={downloadQR}
          disabled={!file.qrUniqueId}
          className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-3.5 text-black/80 transition-colors hover:bg-black/5 disabled:opacity-50 min-h-[56px]"
        >
          <QrCode className="h-4 w-4 text-black/50" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Save QR
          </span>
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3.5 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 min-h-[56px]"
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
            Delete
          </span>
        </button>
      </div>
    </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#F9F9F8]/85 backdrop-blur-md"
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-0 lg:p-[5vh]">
        <motion.div
          layoutId={`file-card-${file.id}`}
          className="pointer-events-auto flex h-[100dvh] w-full lg:h-[90vh] lg:w-[90vw] max-w-[1400px] flex-col lg:flex-row overflow-hidden bg-[#FCFCFA] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] lg:rounded-2xl relative"
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E\")",
          }}
        >
          <div className="flex-1 overflow-y-auto lg:contents pb-[380px] lg:pb-0">
          {/* Top/Left — QR Code */}
          <motion.div
            layoutId={`file-content-${file.id}`}
            className="flex w-full lg:w-[28%] shrink-0 flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-black/5 bg-[#F9F9F8]/80 p-8 lg:p-10"
          >
            <div className="w-full flex justify-start mb-6 lg:hidden">
              <button
                onClick={onClose}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-3 shadow-sm font-mono text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] transition-colors hover:bg-black/5"
              >
                ← Back
              </button>
            </div>

            <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-black/40">
              QR Code
            </p>
            <div className="flex aspect-square w-[200px] lg:w-[240px] items-center justify-center rounded-2xl border border-black/10 bg-white p-6 shadow-lg">
              {file.qrUniqueId ? (
                <QRCodeSVG
                  id={`detail-qr-${file.qrUniqueId}`}
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/scan/${file.qrUniqueId}`}
                  size={192}
                  bgColor="#ffffff"
                  fgColor="#1A1A1A"
                  level="H"
                  className="h-full w-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full text-black/40 text-center">
                  <QrCode className="h-8 w-8 mb-2 opacity-50" strokeWidth={1} />
                  <span className="font-mono text-[10px] uppercase tracking-widest font-bold">QR Unavailable</span>
                </div>
              )}
            </div>
            <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-black/30">
              Scan to access file
            </p>
          </motion.div>

          {/* Center — File Details & Actions */}
          <div className="flex w-full lg:w-[36%] shrink-0 flex-col border-b lg:border-b-0 lg:border-r border-black/5">
            {/* Desktop Back Button */}
            <div className="p-8 pb-4 lg:p-10 lg:pb-4 sticky top-0 bg-[#FCFCFA] z-10">
              <button
                onClick={onClose}
                className="hidden lg:flex w-fit items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-black/60 transition-colors hover:bg-black/5 hover:text-black"
              >
                ← Back
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 lg:px-10 pb-4 scrollbar-hide">

            <motion.div layoutId={`file-title-${file.id}`} className="mb-8 flex items-start justify-between gap-4">
              {isRenaming ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full font-[family-name:var(--font-instrument)] text-3xl lg:text-4xl leading-tight text-[#1A1A1A] bg-transparent border-b border-black/20 focus:border-black outline-none"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsRenaming(false); }}
                  />
                  <button onClick={handleRename} className="p-2 text-green-600 hover:bg-black/5 rounded-full"><Check className="h-5 w-5"/></button>
                  <button onClick={() => setIsRenaming(false)} className="p-2 text-red-600 hover:bg-black/5 rounded-full"><XIcon className="h-5 w-5"/></button>
                </div>
              ) : (
                <>
                  <h2 className="font-[family-name:var(--font-instrument)] text-3xl lg:text-4xl leading-tight text-[#1A1A1A] break-all">
                    {localFile.name}
                  </h2>
                  <button onClick={() => setIsRenaming(true)} className="mt-2 shrink-0 p-2 text-black/40 hover:bg-black/5 hover:text-black rounded-full transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </motion.div>

            <div className="space-y-6">
              <div className="border-b border-black/5 pb-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Project Name</p>
                <p className="text-base font-medium text-[#1A1A1A]">{localFile.projectName}</p>
              </div>
              <div className="border-b border-black/5 pb-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Created Date</p>
                <p className="text-base font-medium text-[#1A1A1A]">{localFile.createdDate}</p>
              </div>
              <div className="border-b border-black/5 pb-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Expiry Date</p>
                {isEditingExpiry ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={newExpiry}
                      onChange={e => setNewExpiry(e.target.value)}
                      className="rounded-md border border-black/20 px-2 py-1 text-sm outline-none"
                    />
                    <button onClick={() => handleUpdateExpiry(newExpiry)} className="p-1.5 text-green-600 hover:bg-black/5 rounded-full"><Check className="h-4 w-4"/></button>
                    <button onClick={() => setIsEditingExpiry(false)} className="p-1.5 text-red-600 hover:bg-black/5 rounded-full"><XIcon className="h-4 w-4"/></button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-base font-medium text-[#1A1A1A]">{localFile.expiryDate}</p>
                    {localFile.qrUniqueId && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setNewExpiry(''); setIsEditingExpiry(true); }} className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black flex items-center gap-1"><Edit2 className="h-3 w-3"/> Edit</button>
                        <button onClick={handleExtend30Days} className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 flex items-center gap-1"><Calendar className="h-3 w-3"/> Extend 30 Days</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="border-b border-black/5 pb-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Uploaded By</p>
                <p className="text-base font-medium text-[#1A1A1A]">{localFile.uploadedBy}</p>
              </div>
              <div className="border-b border-black/5 pb-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Security</p>
                {isEditingPin ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="4-digit PIN"
                        value={newPin}
                        onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="w-24 rounded-md border border-black/20 px-2 py-1 text-sm outline-none text-center tracking-widest font-mono"
                      />
                      <button disabled={isSavingPin} onClick={() => handleUpdatePin(newPin)} className="p-1.5 text-green-600 hover:bg-black/5 rounded-full disabled:opacity-50"><Check className="h-4 w-4"/></button>
                      <button disabled={isSavingPin} onClick={() => { setIsEditingPin(false); setNewPin(''); }} className="p-1.5 text-red-600 hover:bg-black/5 rounded-full disabled:opacity-50"><XIcon className="h-4 w-4"/></button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className={`text-base font-medium ${localFile.requiresPin ? 'text-[#1A1A1A]' : 'text-black/40'}`}>
                      {localFile.requiresPin ? 'PIN Protected' : 'No PIN'}
                    </p>
                    {localFile.qrUniqueId && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setIsEditingPin(true)} className="text-[10px] font-bold uppercase tracking-widest text-black/40 hover:text-black flex items-center gap-1">
                          <Key className="h-3 w-3"/> {localFile.requiresPin ? 'Change PIN' : 'Set PIN'}
                        </button>
                        {localFile.requiresPin && (
                          <button onClick={() => { if(confirm('Remove PIN protection?')) handleUpdatePin(null); }} className="text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 flex items-center gap-1">
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="border-b border-black/5 pb-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Status</p>
                <p className={`text-base font-medium ${localFile.status === 'Active' ? 'text-green-600' : localFile.status === 'Expired' || localFile.status === 'Revoked' ? 'text-red-600' : 'text-amber-600'}`}>
                  {localFile.status}
                </p>
              </div>
            </div>
            
            </div>
            <div className="hidden lg:block p-8 pt-4 lg:p-10 lg:pt-4 sticky bottom-0 bg-[#FCFCFA] z-10 border-t border-black/5">
              {renderActions()}
            </div>
          </div>

          {/* Right — Analytics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex flex-1 flex-col p-8 lg:p-10 bg-white/40"
          >
            <p className="mb-8 font-mono text-[10px] uppercase tracking-widest text-black/40">
              Analytics
            </p>

            <div className="mb-8 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">
                  Total Scans
                </p>
                <p className="font-[family-name:var(--font-instrument)] text-4xl text-[#1A1A1A]">
                  {file.scans}
                </p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">
                  Last Scan
                </p>
                <p className="mt-1 text-lg font-medium text-[#1A1A1A]">{file.lastScan}</p>
              </div>
            </div>

            <div className="mb-8 rounded-xl border border-black/5 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/40">
                  Scan Trend
                </p>
                <TrendingUp className="h-4 w-4 text-green-600/60" />
              </div>
              <div className="flex h-20 items-end gap-1.5">
                {file.scanTrend.map((val, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-[#1A1A1A]/80 transition-all"
                    style={{ height: `${(val / maxTrend) * 100}%`, minHeight: 4 }}
                  />
                ))}
              </div>
            </div>

            <div className="flex-1">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-black/40">
                Recent Activity
              </p>
              <div className="space-y-3">
                {file.recentActivity.map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-black/5 bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500/60" />
                    <span className="text-sm text-black/70">{activity}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
          </div>
          
          <div className="lg:hidden absolute bottom-0 left-0 right-0 p-5 bg-[#FCFCFA] border-t border-black/10 shadow-[0_-20px_40px_rgba(0,0,0,0.08)] z-50">
            {renderActions()}
          </div>
        </motion.div>
      </div>
    </>
  );
}
