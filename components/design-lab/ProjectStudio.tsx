"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";
import FileDetailPanel from "@/components/design-lab/FileDetailPanel";
import type { DesignLabProject, DesignLabFile } from "@/components/design-lab/types";
import { FileText, FileSpreadsheet, QrCode, Printer, Download, ChevronDown, Loader2 } from "lucide-react";
import type { QRLayout, QRLabelData } from "@/components/pdf/QRLabelPDF";
import { useBackButton } from "@/hooks/useBackButton";

interface ProjectStudioProps {
  project: DesignLabProject;
  onClose: () => void;
}

export default function ProjectStudio({ project, onClose }: ProjectStudioProps) {
  const router = useRouter();
  const { triggerRipple } = useCanvasEffect();
  const [activeTab, setActiveTab] = useState("files");
  const [selectedFile, setSelectedFile] = useState<DesignLabFile | null>(null);

  // Intercept back button to close this studio instead of navigating away
  useBackButton(true, onClose);

  const [projectFiles, setProjectFiles] = useState<DesignLabFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Export state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: reports, error } = await supabase
        .from('reports')
        .select(`
          id, status,
          files(
            id, file_name, file_type, file_path, file_size, created_at,
            qr_codes(id, qr_unique_id, expiry_date, is_active, password_hash)
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
          .select('qr_id, was_blocked, scanned_at')
          .in('qr_id', qrIds)
          .order('scanned_at', { ascending: false });

        logs?.forEach(log => {
          if (!log.was_blocked) {
            scanCounts.set(log.qr_id, (scanCounts.get(log.qr_id) || 0) + 1);
            if (!lastScanDates.has(log.qr_id)) {
              lastScanDates.set(log.qr_id, new Date(log.scanned_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' }));
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

          let status: "Active" | "Expired" | "Needs Attention" | "Revoked" | "Expiring Soon" = report.status === 'pass' ? 'Active' : 'Needs Attention';
          if (qr) {
            if (qr.is_active === false) {
              status = "Revoked";
            } else if (qr.expiry_date) {
              const diff = new Date(qr.expiry_date).getTime() - new Date().getTime();
              if (diff < 0) status = "Expired";
              else if (diff < 7 * 24 * 60 * 60 * 1000) status = "Expiring Soon";
            }
          }

          mappedFiles.push({
            id: f.id,
            name: f.file_name,
            type: f.file_type.includes('pdf') ? 'pdf' : (f.file_type.includes('sheet') ? 'spreadsheet' : 'document'),
            projectName: project.name,
            createdDate: new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            expiryDate: qr?.expiry_date ? new Date(qr.expiry_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "Never",
            uploadedBy: "System",
            status,
            requiresPin: !!qr?.password_hash,
            date: "Recently",
            rotation: 0,
            yOffset: 0,
            xOffset: 0,
            scans: scans,
            lastScan: lastScan,
            scanTrend: [0, 0, 0, 0, 0, 0, 0], // Not implemented historically
            recentActivity: scans > 0 ? [`Last scanned: ${lastScan}`] : ["Uploaded to Retriqo"],
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
  };

  useEffect(() => {
    if (project.id) {
      fetchFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const labels: (QRLabelData | null)[] = projectFiles.map((file) => {
      if (!file.qrUniqueId) {
        // Log the exact file that is missing its QR ID — never fabricate a substitute
        console.error(`[QR INTEGRITY] qrUniqueId is missing for file id=${file.id} name="${file.name}". This file will be excluded from QR labels.`);
        return null;
      }
      return {
        machineName: file.projectName,
        fileName: file.name,
        qrUniqueId: file.qrUniqueId,
        expiryDate: file.expiryDate,
        generatedDate: new Date().toISOString(),
        status: (file.status === "Active" ? "pass" : "needs_attention") as "pass" | "needs_attention",
        qrDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=512&data=${typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || ''}/scan/${file.qrUniqueId}`,
      };
    });
    return labels.filter((label): label is QRLabelData => label !== null);
  };

  const generatePDFBlob = async (layout: QRLayout) => {
    const labels = getQRLabelData();
    if (labels.length === 0) {
      throw new Error('No files have a valid QR code. Generate QR codes before downloading labels.');
    }

    const [{ pdf }, { QRLabelPDF }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/components/pdf/QRLabelPDF"),
    ]);

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
        <div className="mx-auto max-w-6xl px-4 lg:px-8 py-6 lg:py-12">
          <motion.div 
            className="mb-8 lg:mb-16 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl lg:rounded-full bg-white/40 px-6 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl border border-white/30"
          >
            <button
              onClick={() => {
                triggerRipple("#1A1A1A");
                onClose();
              }}
              className="flex w-full sm:w-auto items-center justify-center sm:justify-start gap-2 rounded-full px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-widest transition-colors hover:bg-black/5"
            >
              ← Back
            </button>

            <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => handlePrint()}
                disabled={isGeneratingPrint || isGeneratingPdf}
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2 transition-colors hover:bg-black/5 disabled:opacity-50"
              >
                {isGeneratingPrint ? (
                  <Loader2 className="h-4 w-4 animate-spin text-black/60" />
                ) : (
                  <Printer className="h-4 w-4 text-black/60" />
                )}
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]">
                  Print
                </span>
              </button>

              <div className="relative flex-1 sm:flex-none">
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  disabled={isGeneratingPdf || isGeneratingPrint}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2 transition-colors hover:bg-black/5 disabled:opacity-50"
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
                      className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-black/5 bg-white p-1 shadow-xl shadow-black/5 z-50"
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
                className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-full bg-[#111111] px-5 py-2 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest">
                  New
                </span>
              </button>
            </div>
          </motion.div>

          <motion.div layoutId={`project-content-${project.id}`} className="mb-8 lg:mb-12">
            <motion.h1
              className="mb-6 font-[family-name:var(--font-instrument)] text-4xl lg:text-6xl text-[#1A1A1A] break-all"
            >
              {project.name}
            </motion.h1>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pb-8 border-b border-black/5">
              <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Total Files</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{projectFiles.length}</p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Total Scans</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{projectFiles.reduce((acc, f) => acc + (f.scans || 0), 0)}</p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Active Files</p>
                <p className="text-2xl font-bold text-green-600">{projectFiles.filter(f => f.status === 'Active').length}</p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Expiring Soon</p>
                <p className="text-2xl font-bold text-amber-500">{projectFiles.filter(f => f.status === 'Expiring Soon').length}</p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Expired</p>
                <p className="text-2xl font-bold text-red-600">{projectFiles.filter(f => f.status === 'Expired' || f.status === 'Revoked').length}</p>
              </div>
              <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">Last Activity</p>
                <p className="text-lg font-bold text-[#1A1A1A] mt-1">{project.lastActivity}</p>
              </div>
            </div>
          </motion.div>

          <div className="mb-8 flex gap-8 border-b border-black/5 overflow-x-auto">
            <button
              onClick={() => setActiveTab("files")}
              className={`pb-4 whitespace-nowrap font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                activeTab === "files"
                  ? "border-b-2 border-black text-black"
                  : "text-black/40 hover:text-black/80"
              }`}
            >
              Files & QR Codes
            </button>
          </div>

          {activeTab === "files" && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-black/20" /></div>
              ) : projectFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-dashed border-black/10 bg-white/50 text-center">
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
                <div className="space-y-3">
                  <div className="mb-6 rounded-xl border border-black/5 bg-black/[0.02] px-5 py-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-black/50">
                      Click a file to view QR codes, download assets, and manage access.
                    </p>
                  </div>
                  {projectFiles.map((file) => (
                    <motion.div
                      key={file.id}
                      layoutId={`file-card-${file.id}`}
                    onClick={() => {
                      triggerRipple("#34C759");
                      setSelectedFile(file);
                    }}
                    className="group relative flex cursor-pointer items-center justify-between rounded-2xl border border-black/5 bg-white p-4 transition-all duration-300 hover:-translate-y-0.5 hover:translate-x-1 hover:bg-black/[0.02] hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.08)]"
                  >
                    <motion.div layoutId={`file-content-${file.id}`} className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <div className="rounded-lg bg-black/5 p-3 self-start sm:self-center">
                      {getIcon(file.type)}
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <motion.h4
                        layoutId={`file-title-${file.id}`}
                        className="font-medium text-[#1A1A1A] break-all"
                      >
                        {file.name}
                      </motion.h4>
                      <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-black/50">
                        <span className="flex items-center gap-1.5 min-w-[120px]">
                          <span className={`h-2 w-2 rounded-full ${
                            file.status === "Active" ? "bg-green-500" :
                            file.status === "Expired" || file.status === "Revoked" ? "bg-red-500" :
                            file.status === "Expiring Soon" ? "bg-amber-500" :
                            "bg-amber-500"
                          }`} />
                          {file.status}
                        </span>
                        <span className="flex items-center gap-1.5 min-w-[100px]">
                          <QrCode className="h-3.5 w-3.5" />
                          {file.scans} Scans
                        </span>
                        <span className="min-w-[140px]">Expires: {file.expiryDate}</span>
                        {file.lastScan !== "Never" && (
                          <span className="min-w-[140px]">Last Scanned: {file.lastScan}</span>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:flex ml-2 rounded-full bg-black/5 p-2 transition-colors group-hover:bg-black/10">
                      <ArrowRight className="h-4 w-4 text-black/60" />
                    </div>
                  </motion.div>
                </motion.div>
                ))}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedFile && (
          <FileDetailPanel 
            file={selectedFile} 
            onClose={() => setSelectedFile(null)} 
            onDelete={() => {
              setSelectedFile(null);
              fetchFiles();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
