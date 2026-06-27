"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, FileSpreadsheet, QrCode, Download, Trash2 } from "lucide-react";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";
import FileDetailPanel from "@/components/design-lab/FileDetailPanel";
import type { DesignLabFile } from "@/components/design-lab/types";

const MOCK_RECENT_FILES: DesignLabFile[] = [
  {
    id: "1",
    name: "Inspection_Report_M7.pdf",
    type: "pdf",
    requiresPin: false,
    projectName: "Bridge Construction Phase 2",
    createdDate: "Aug 12, 2024",
    expiryDate: "Feb 12, 2025",
    uploadedBy: "Sarah Chen",
    status: "Active",
    date: "2 mins ago",
    rotation: -2.5,
    yOffset: 6,
    xOffset: -8,
    scans: 47,
    lastScan: "Today, 9:14 AM",
    scanTrend: [4, 7, 5, 12, 8, 15, 11],
    recentActivity: [
      "Scanned from iPhone — Field Site M7",
      "Downloaded by J. Martinez",
      "QR regenerated — Aug 28",
    ],
  },
  {
    id: "2",
    name: "Pump_Status_August.pdf",
    type: "pdf",
    requiresPin: false,
    projectName: "Boiler Room Inspection",
    createdDate: "Aug 01, 2024",
    expiryDate: "Never",
    uploadedBy: "Mike Torres",
    status: "Active",
    date: "1 hour ago",
    rotation: 1.8,
    yOffset: -4,
    xOffset: 12,
    scans: 23,
    lastScan: "Yesterday, 4:32 PM",
    scanTrend: [2, 5, 3, 8, 6, 4, 9],
    recentActivity: [
      "Scanned from Android — Pump Room B",
      "Viewed by maintenance team",
    ],
  },
  {
    id: "3",
    name: "Safety_Checklist.xlsx",
    type: "spreadsheet",
    requiresPin: false,
    projectName: "Machine Line A",
    createdDate: "Jul 18, 2024",
    expiryDate: "Jan 18, 2025",
    uploadedBy: "Sarah Chen",
    status: "Active",
    date: "4 hours ago",
    rotation: -1.2,
    yOffset: 8,
    xOffset: 0,
    scans: 89,
    lastScan: "Today, 7:02 AM",
    scanTrend: [10, 14, 18, 12, 20, 16, 22],
    recentActivity: [
      "Scanned from iPad — Line A Floor",
      "Shared via QR link",
      "Scanned from iPhone — Safety Office",
    ],
  },
  {
    id: "4",
    name: "Generator_Service_Log.pdf",
    type: "pdf",
    requiresPin: false,
    projectName: "Vendor Documents",
    createdDate: "Jun 30, 2024",
    expiryDate: "Dec 30, 2024",
    uploadedBy: "Alex Kim",
    status: "Active",
    date: "Yesterday",
    rotation: 3,
    yOffset: -2,
    xOffset: -16,
    scans: 14,
    lastScan: "Oct 10, 2024",
    scanTrend: [1, 3, 2, 5, 4, 3, 6],
    recentActivity: [
      "Scanned from iPhone — Generator Bay",
      "Downloaded by vendor rep",
    ],
  },
];

interface RecentFilesProps {
  onFileOpenChange?: (open: boolean) => void;
}

export default function RecentFiles({ onFileOpenChange }: RecentFilesProps) {
  const deskRef = useRef<HTMLDivElement>(null);
  const [selectedFile, setSelectedFile] = useState<DesignLabFile | null>(null);
  const canvasEffect = useCanvasEffect();

  const openFile = (file: DesignLabFile) => {
    setSelectedFile(file);
    onFileOpenChange?.(true);
    canvasEffect.trigger("#D4A017");
  };

  const closeFile = () => {
    setSelectedFile(null);
    onFileOpenChange?.(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "spreadsheet":
        return <FileSpreadsheet className="h-8 w-8 text-green-600/70" />;
      default:
        return <FileText className="h-8 w-8 text-red-500/70" />;
    }
  };

  const paperStyle = {
    boxShadow:
      "0 12px 40px -12px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.03)",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.025'/%3E%3C/svg%3E\")",
  };

  return (
    <>
      <div className="relative z-20 mb-32 w-full">
        <div className="mb-12 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-instrument)] text-3xl text-[#1A1A1A]">
            Recent Files
          </h2>
          <button className="font-mono text-[10px] uppercase tracking-widest text-black/40 transition-colors hover:text-black">
            View All
          </button>
        </div>

        {/* Workbench desk — scattered paper cards */}
        <div
          ref={deskRef}
          className="relative flex min-h-[420px] flex-wrap items-start justify-center gap-6 py-8 md:gap-10"
        >
          {MOCK_RECENT_FILES.map((file, i) => (
            <motion.div
              key={file.id}
              layoutId={`file-card-${file.id}`}
              drag={selectedFile === null}
              dragConstraints={deskRef}
              dragElastic={0.08}
              initial={{ opacity: 0, y: 30, rotate: file.rotation }}
              animate={{
                opacity: selectedFile && selectedFile.id !== file.id ? 0.3 : 1,
                y: file.yOffset,
                x: file.xOffset,
                rotate: file.rotation,
                scale: selectedFile && selectedFile.id !== file.id ? 0.95 : 1,
              }}
              whileDrag={{ scale: 1.06, rotate: 0, zIndex: 50, cursor: "grabbing" }}
              whileHover={{
                scale: 1.04,
                y: file.yOffset - 14,
                rotate: 0,
                zIndex: 40,
                transition: { type: "spring", stiffness: 400, damping: 22 },
              }}
              transition={{
                delay: i * 0.08,
                type: "spring",
                stiffness: 260,
                damping: 22,
              }}
              onClick={() => openFile(file)}
              className="group relative flex h-72 w-64 cursor-grab flex-col rounded-xl bg-[#FCFCFA] p-6"
              style={paperStyle}
            >
              <motion.div
                layoutId={`file-content-${file.id}`}
                className="flex h-full flex-col"
              >
                <div className="mb-10 flex items-start justify-between">
                  <div className="rounded-2xl border border-black/5 bg-white p-3.5 shadow-sm">
                    {getIcon(file.type)}
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3 py-1.5 text-black/60 shadow-sm">
                    <QrCode className="h-3.5 w-3.5" />
                    <span className="font-mono text-[10px] font-bold">{file.scans}</span>
                  </div>
                </div>

                <div className="mt-auto">
                  <motion.h3
                    layoutId={`file-title-${file.id}`}
                    className="mb-2 truncate text-lg font-medium leading-tight text-[#1A1A1A]"
                  >
                    {file.name}
                  </motion.h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-black/40">
                    {file.date}
                  </p>
                </div>
              </motion.div>

              {/* Hover action hints */}
              <div className="absolute inset-0 flex items-center justify-center gap-3 rounded-xl bg-white/50 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                <button
                  className="rounded-full bg-white p-3 text-black/70 shadow-md transition-transform hover:scale-110 active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Download className="h-4 w-4" />
                </button>
                <button
                  className="rounded-full bg-white p-3 text-red-500/70 shadow-md transition-transform hover:scale-110 hover:text-red-600 active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    canvasEffect.trigger("#FF6B6B");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Layered paper depth */}
              <div className="absolute inset-0 -z-10 translate-y-1 scale-[0.98] rounded-xl border border-black/5 bg-[#FCFCFA] opacity-50 shadow-sm" />
              <div className="absolute inset-0 -z-20 translate-y-2 scale-[0.96] rounded-xl border border-black/5 bg-[#FCFCFA] opacity-25 shadow-sm" />
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedFile && (
          <FileDetailPanel file={selectedFile} onClose={closeFile} />
        )}
      </AnimatePresence>
    </>
  );
}
