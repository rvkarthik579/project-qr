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
} from "lucide-react";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";
import type { DesignLabFile } from "@/components/design-lab/types";
import { QRCodeSVG } from "qrcode.react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useState } from "react";

interface FileDetailPanelProps {
  file: DesignLabFile;
  onClose: () => void;
}

export default function FileDetailPanel({ file, onClose }: FileDetailPanelProps) {
  const { triggerRipple } = useCanvasEffect();
  const maxTrend = Math.max(...file.scanTrend, 1);
  const [isDownloadingFile, setIsDownloadingFile] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this file and its QR codes?')) return;
    setIsDeleting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (file.filePath) {
        await supabase.storage.from('project_files').remove([file.filePath]);
      }
      const { error } = await supabase.from('files').delete().eq('id', file.id);
      if (error) throw error;
      onClose();
      window.location.reload();
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

  const downloadFile = async () => {
    if (!file.filePath) return;
    setIsDownloadingFile(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.storage.from('project_files').download(file.filePath);
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download file", err);
      alert("Failed to download file");
    } finally {
      setIsDownloadingFile(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#F9F9F8]/85 backdrop-blur-md"
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-[5vh]">
        <motion.div
          layoutId={`file-card-${file.id}`}
          className="pointer-events-auto flex h-[90vh] w-[90vw] max-w-[1400px] overflow-hidden rounded-2xl bg-[#FCFCFA] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2),0_0_0_1px_rgba(0,0,0,0.05)]"
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E\")",
          }}
        >
          {/* Left — QR Code */}
          <motion.div
            layoutId={`file-content-${file.id}`}
            className="flex w-[28%] shrink-0 flex-col items-center justify-center border-r border-black/5 bg-[#F9F9F8]/80 p-10"
          >
            <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-black/40">
              QR Code
            </p>
            <div className="flex aspect-square w-[240px] h-[240px] items-center justify-center rounded-2xl border border-black/10 bg-white p-6 shadow-lg">
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
                <QrCode className="h-full w-full text-black/20" strokeWidth={0.75} />
              )}
            </div>
            <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-black/30">
              Scan to access file
            </p>
          </motion.div>

          {/* Center — File Details */}
          <div className="flex w-[36%] shrink-0 flex-col border-r border-black/5 p-10">
            <button
              onClick={onClose}
              className="mb-8 flex w-fit items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-black/60 transition-colors hover:bg-black/5 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <motion.h2
              layoutId={`file-title-${file.id}`}
              className="mb-8 font-[family-name:var(--font-instrument)] text-4xl leading-tight text-[#1A1A1A]"
            >
              {file.name}
            </motion.h2>

            <div className="space-y-6">
              {[
                { label: "Project Name", value: file.projectName },
                { label: "Created Date", value: file.createdDate },
                { label: "Expiry Date", value: file.expiryDate },
                { label: "Uploaded By", value: file.uploadedBy },
                {
                  label: "Status",
                  value: file.status,
                  highlight: file.status === "Active" ? "text-green-600" : "text-amber-600",
                },
              ].map((row) => (
                <div key={row.label} className="border-b border-black/5 pb-4">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">
                    {row.label}
                  </p>
                  <p className={`text-base font-medium ${row.highlight ?? "text-[#1A1A1A]"}`}>
                    {row.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-8">
              <button 
                onClick={downloadFile}
                disabled={isDownloadingFile || !file.filePath}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] py-3.5 text-white transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
              >
                {isDownloadingFile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="font-mono text-[11px] font-medium uppercase tracking-widest">
                  {isDownloadingFile ? "Downloading..." : "Download File"}
                </span>
              </button>
              <button
                onClick={downloadQR}
                disabled={!file.qrUniqueId}
                className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-3.5 text-black/80 transition-colors hover:bg-black/5 disabled:opacity-50"
              >
                <QrCode className="h-4 w-4 text-black/50" />
                <span className="font-mono text-[11px] font-medium uppercase tracking-widest">
                  Download QR
                </span>
              </button>
              <button
                onClick={() => triggerRipple("#D4A017")}
                className="flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-3.5 text-black/80 transition-colors hover:bg-black/5"
              >
                <RotateCw className="h-4 w-4 text-black/50" />
                <span className="font-mono text-[11px] font-medium uppercase tracking-widest">
                  Regenerate QR
                </span>
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3.5 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                <span className="font-mono text-[11px] font-medium uppercase tracking-widest">
                  {isDeleting ? "Deleting..." : "Delete"}
                </span>
              </button>
            </div>
          </div>

          {/* Right — Analytics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex flex-1 flex-col p-10"
          >
            <p className="mb-8 font-mono text-[10px] uppercase tracking-widest text-black/40">
              Analytics
            </p>

            <div className="mb-8 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-black/5 bg-white p-5">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">
                  Total Scans
                </p>
                <p className="font-[family-name:var(--font-instrument)] text-4xl text-[#1A1A1A]">
                  {file.scans}
                </p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-5">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">
                  Last Scan
                </p>
                <p className="mt-1 text-lg font-medium text-[#1A1A1A]">{file.lastScan}</p>
              </div>
            </div>

            <div className="mb-8 rounded-xl border border-black/5 bg-white p-5">
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
                    className="flex items-center gap-3 rounded-lg border border-black/5 bg-white/80 px-4 py-3"
                  >
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500/60" />
                    <span className="text-sm text-black/70">{activity}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
