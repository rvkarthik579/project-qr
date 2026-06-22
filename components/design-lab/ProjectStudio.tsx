"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Search, Settings2, Plus } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";
import FileDetailPanel from "@/components/design-lab/FileDetailPanel";
import type { DesignLabProject, DesignLabFile } from "@/components/design-lab/types";
import { FileText, FileSpreadsheet, QrCode, Printer, Download, ChevronDown, Loader2 } from "lucide-react";
import type { QRLayout, QRLabelData } from "@/components/pdf/QRLabelPDF";

interface ProjectStudioProps {
  project: DesignLabProject;
  onClose: () => void;
}

// Mock files removed

export default function ProjectStudio({ project, onClose }: ProjectStudioProps) {
  const router = useRouter();
  const { triggerRipple } = useCanvasEffect();
  const [activeTab, setActiveTab] = useState("files");
  const [selectedFile, setSelectedFile] = useState<DesignLabFile | null>(null);

  const [projectFiles, setProjectFiles] = useState<DesignLabFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Export state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);

  useEffect(() => {
    async function fetchFiles() {
      setIsLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: reports, error } = await supabase
          .from('reports')
          .select(`
            id, status,
            files(
              id, file_name, file_type, file_path, file_size, created_at,
              qr_codes(id, qr_unique_id, expiry_date, is_active)
            )
          `)
          .eq('project_id', project.id);

        if (error) {
          console.error("Error fetching files:", error);
          setProjectFiles([]);
          return;
        }

        const qrIds: string[] = [];
        reports?.forEach(report => {
          report.files?.forEach((f: any) => {
            const qr = f.qr_codes?.[0]; // Assume 1 QR per file
            if (qr?.id) qrIds.push(qr.id);
          });
        });

        const scanCounts = new Map<string, number>();
        const lastScanDates = new Map<string, string>();

        if (qrIds.length > 0) {
          const { data: logs } = await supabase
            .from('scan_logs')
            .select('qr_id, was_blocked, created_at')
            .in('qr_id', qrIds)
            .order('created_at', { ascending: false });

          logs?.forEach(log => {
            if (!log.was_blocked) {
              scanCounts.set(log.qr_id, (scanCounts.get(log.qr_id) || 0) + 1);
              if (!lastScanDates.has(log.qr_id)) {
                lastScanDates.set(log.qr_id, new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }));
              }
            }
          });
        }

        const mappedFiles: DesignLabFile[] = [];
        reports?.forEach(report => {
          report.files?.forEach((f: any) => {
            const qr = f.qr_codes?.[0]; // Assume 1 QR per file
            const scans = qr ? (scanCounts.get(qr.id) || 0) : 0;
            const lastScan = qr ? (lastScanDates.get(qr.id) || "Never") : "Never";

            mappedFiles.push({
              id: f.id,
              name: f.file_name,
              type: f.file_type.includes('pdf') ? 'pdf' : (f.file_type.includes('sheet') ? 'spreadsheet' : 'document'),
              projectName: project.name,
              createdDate: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
              expiryDate: qr?.expiry_date ? new Date(qr.expiry_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "Never",
              uploadedBy: "System",
              status: report.status === 'pass' ? 'Active' : 'Needs Attention',
              date: "Recently",
              rotation: 0,
              yOffset: 0,
              xOffset: 0,
              scans: scans,
              lastScan: lastScan,
              scanTrend: [0, 0, 0, 0, 0, 0, 0], // Not implemented historically
              recentActivity: scans > 0 ? [`Last scanned: ${lastScan}`] : ["Uploaded to Project QR"],
              qrUniqueId: qr?.qr_unique_id,
              filePath: f.file_path,
            });
          });
        });

        setProjectFiles(mappedFiles);
      } catch (err) {
        console.error("Failed to load project files:", err);
        setProjectFiles([]);
      } finally {
        setIsLoading(false);
      }

    }

    if (project.id) {
      fetchFiles();
    }
  }, [project.id, project.name]);

  const getIcon = (type: string) => {
    switch (type) {
      case "spreadsheet":
        return <FileSpreadsheet className="h-5 w-5 text-green-600/70" />;
      default:
        return <FileText className="h-5 w-5 text-red-500/70" />;
    }
  };

  const getQRLabelData = (): QRLabelData[] => {
    return projectFiles.map((file) => ({
      machineName: file.projectName,
      fileName: file.name,
      qrUniqueId: file.qrUniqueId || `QR-${file.id.toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
      expiryDate: file.expiryDate,
      generatedDate: new Date().toISOString(),
      status: file.status === "Active" ? "pass" : "needs_attention",
      // Production app URL for QR scanning
      qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=512&data=https://projectqr.app/scan/${file.qrUniqueId}`,
    }));
  };

  const generatePDFBlob = async (layout: QRLayout) => {
    const [{ pdf }, { QRLabelPDF }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/pdf/QRLabelPDF"),
    ]);

    const labels = getQRLabelData();
    const blob = await pdf(<QRLabelPDF labels={labels} layout={layout} />).toBlob();
    return blob;
  };

  const handleExport = async (layout: QRLayout) => {
    try {
      setIsGeneratingPdf(true);
      const blob = await generatePDFBlob(layout);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, "_")}_QRLabels.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = async () => {
    try {
      setIsGeneratingPrint(true);
      // Default to 6-up for print
      const blob = await generatePDFBlob(6);
      const url = URL.createObjectURL(blob);
      // Open in new tab, the browser will usually natively support printing the PDF
      window.open(url, "_blank");
    } catch (error) {
      console.error("Failed to prepare print", error);
    } finally {
      setIsGeneratingPrint(false);
    }
  };

  return (
    <>
      <motion.div
        layoutId={`project-card-${project.id}`}
        className="fixed inset-0 z-40 overflow-y-auto bg-[#F9F9F8]"
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      >
        <div className="mx-auto max-w-6xl px-8 py-12">
          <motion.div 
            className="mb-16 flex items-center justify-between rounded-full bg-white/40 px-6 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-white/30"
          >
            <button
              onClick={() => {
                triggerRipple("#1A1A1A");
                onClose();
              }}
              className="flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-widest transition-colors hover:bg-black/5"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>

            <div className="flex gap-3">
              {/* Search button temporarily removed for Phase 1 release */}

              <button
                onClick={() => handlePrint()}
                disabled={isGeneratingPrint || isGeneratingPdf}
                className="flex items-center gap-2 rounded-full border border-black/10 px-5 py-2 transition-colors hover:bg-black/5 disabled:opacity-50"
              >
                {isGeneratingPrint ? (
                  <Loader2 className="h-4 w-4 animate-spin text-black/60" />
                ) : (
                  <Printer className="h-4 w-4 text-black/60" />
                )}
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]">
                  Print Labels
                </span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  disabled={isGeneratingPdf || isGeneratingPrint}
                  className="flex items-center gap-2 rounded-full border border-black/10 px-5 py-2 transition-colors hover:bg-black/5 disabled:opacity-50"
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin text-black/60" />
                  ) : (
                    <Download className="h-4 w-4 text-black/60" />
                  )}
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]">
                    Export PDF
                  </span>
                  <ChevronDown className="ml-1 h-3 w-3 text-black/40" />
                </button>

                <AnimatePresence>
                  {isExportMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-black/5 bg-white p-1 shadow-xl shadow-black/5 z-50"
                    >
                      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-black/30">Layout (Per Page)</div>
                      {[1, 2, 4, 6, 9].map((layoutNum) => (
                        <button
                          key={layoutNum}
                          onClick={() => {
                            setIsExportMenuOpen(false);
                            handleExport(layoutNum as QRLayout);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-black/5"
                        >
                          {layoutNum} Labels
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => {
                  triggerRipple("#2BBBAD");
                  router.push(`/dashboard/projects/${project.id}/upload`);
                }}
                className="ml-2 flex items-center gap-2 rounded-full bg-[#111111] px-6 py-2 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                  New File
                </span>
              </button>
            </div>
          </motion.div>

          <motion.div layoutId={`project-content-${project.id}`} className="mb-16">
            <motion.h1
              className="mb-6 font-[family-name:var(--font-instrument)] text-6xl text-[#1A1A1A]"
            >
              {project.name}
            </motion.h1>
            <div className="flex gap-8 border-b border-black/5 pb-8">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">
                  Files
                </span>
                <span className="text-lg">{project.filesCount}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">
                  QR Codes
                </span>
                <span className="text-lg">{project.qrCount}</span>
              </div>
              {/* Analytics header temporarily removed */}
              <div className="flex flex-col gap-1">
                <span className="font-mono text-[10px] uppercase tracking-widest text-black/40">
                  Last Activity
                </span>
                <span className="text-lg">{project.lastActivity}</span>
              </div>
            </div>
          </motion.div>

          <div className="mb-8 flex gap-8 border-b border-black/5">
            <button
              onClick={() => setActiveTab("files")}
              className={`pb-4 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                activeTab === "files"
                  ? "border-b-2 border-black text-black"
                  : "text-black/40 hover:text-black/80"
              }`}
            >
              Files & QR Codes
            </button>
            {/* Analytics tab temporarily removed */}
          </div>

          {activeTab === "files" && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-black/20" /></div>
              ) : projectFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-dashed border-black/10 bg-white/50 text-center">
                  <div className="rounded-full bg-[#1A1A1A]/5 p-4 mb-4">
                    <FileText className="h-8 w-8 text-[#1A1A1A]/40" />
                  </div>
                  <h3 className="mb-2 font-[family-name:var(--font-instrument)] text-2xl text-[#1A1A1A]">No Files Yet</h3>
                  <p className="mb-6 max-w-md text-sm text-black/50">
                    Upload documents or spreadsheets to generate your first set of QR labels for {project.name}.
                  </p>
                  <button
                    onClick={() => {
                      triggerRipple("#2BBBAD");
                      router.push(`/dashboard/projects/${project.id}/upload`);
                    }}
                    className="flex items-center gap-2 rounded-full bg-[#111111] px-6 py-3 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                      Upload First File
                    </span>
                  </button>
                </div>
              ) : (
                projectFiles.map((file) => (
                  <motion.div
                    key={file.id}
                    layoutId={`file-card-${file.id}`}
                  onClick={() => {
                    triggerRipple("#34C759");
                    setSelectedFile(file);
                  }}
                  className="group flex cursor-pointer items-center justify-between rounded-2xl border border-black/5 bg-white p-4 transition-all hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.1)]"
                >
                  <motion.div layoutId={`file-content-${file.id}`} className="flex flex-1 items-center gap-6">
                    <div className="rounded-lg bg-black/5 p-3">
                      {getIcon(file.type)}
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <motion.h4
                        layoutId={`file-title-${file.id}`}
                        className="font-medium text-[#1A1A1A]"
                      >
                        {file.name}
                      </motion.h4>
                      <div className="mt-1 flex items-center gap-6 text-sm text-black/50">
                        <span className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${file.status === "Active" ? "bg-green-500" : "bg-amber-500"}`} />
                          {file.status}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <QrCode className="h-3.5 w-3.5" />
                          {file.scans} Scans
                        </span>
                        <span>Created: {file.createdDate}</span>
                        <span>Expires: {file.expiryDate}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="rounded-full bg-black/5 p-2 transition-colors hover:bg-black/10">
                        <span className="sr-only">Download</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      </button>
                      <button className="rounded-full bg-black/5 p-2 transition-colors hover:bg-black/10">
                        <span className="sr-only">More actions</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="flex h-64 w-full flex-col items-center justify-center rounded-2xl border border-black/5 bg-white text-black/40">
              <p className="font-mono text-[11px] uppercase tracking-widest">
                Analytics are currently unavailable
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedFile && <FileDetailPanel file={selectedFile} onClose={() => setSelectedFile(null)} />}
      </AnimatePresence>
    </>
  );
}
