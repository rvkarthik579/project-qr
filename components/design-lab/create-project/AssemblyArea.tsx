"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import type { PanInfo } from "framer-motion";
import FileArtifact from "./FileArtifact";
import InspectionCard from "./InspectionCard";
import type { WorkspaceFile } from "./CreateProjectWorkspace";

interface AssemblyAreaProps {
  files: WorkspaceFile[];
  setFiles: React.Dispatch<React.SetStateAction<WorkspaceFile[]>>;
}

export default function AssemblyArea({ files, setFiles }: AssemblyAreaProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);

  const simulateUploadBatch = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const newFiles: WorkspaceFile[] = [
        { id: `f-${Date.now()}-1`, name: "Maintenance_Report.pdf", type: "application/pdf", isConverted: false },
        { id: `f-${Date.now()}-2`, name: "Machine_Diagram.png", type: "image/png", isConverted: false },
        { id: `f-${Date.now()}-3`, name: "Legacy_Archive.rar", type: "application/rar", isConverted: false },
        { id: `f-${Date.now()}-4`, name: "AutoUpdater.exe", type: "application/exe", isConverted: false },
        { id: `f-${Date.now()}-5`, name: "Manual_Vol2.docx", type: "application/docx", isConverted: false },
      ];
      setFiles((prev) => [...prev, ...newFiles]);
      setIsSimulating(false);
      setIsInspecting(true);
    }, 1200);
  };

  const getStatus = (filename: string): "PASS" | "ATTENTION" | "ACTION_REQUIRED" => {
    if (filename.endsWith(".rar") || filename.endsWith(".7z")) return "ATTENTION";
    if (filename.endsWith(".exe") || filename.endsWith(".bat") || filename.endsWith(".sh")) return "ACTION_REQUIRED";
    return "PASS";
  };

  const handleClearApproved = () => {
    // Keep only PASS files, dismiss the rest, end inspection phase
    setFiles(prev => prev.filter(f => getStatus(f.name) === "PASS"));
    setIsInspecting(false);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, fileId: string) => {
    // Check if dropped on the right side of the screen (Crucible area)
    if (info.point.x > window.innerWidth / 2) {
      setFiles((prev) => prev.map(f => f.id === fileId ? { ...f, isConverted: true } : f));
    }
  };

  const pendingFiles = files.filter(f => !f.isConverted);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-instrument)] text-4xl text-[#1A1A1A]">
            {isInspecting ? "File Intelligence" : "Assembly Area"}
          </h3>
          <p className="mt-2 text-sm font-medium text-[#1A1A1A]/50">
            {isInspecting 
              ? "Artifact Analysis Station. Review incoming materials."
              : "Deposit files here. Drag cleared artifacts into the Brass Crucible."
            }
          </p>
        </div>
        
        {pendingFiles.length === 0 && !isSimulating && (
          <button 
            onClick={simulateUploadBatch}
            className="rounded-full border border-black/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-black/40 hover:bg-black/5 hover:text-black"
          >
            + Simulate Upload Batch
          </button>
        )}

        {isInspecting && (
          <button 
            onClick={handleClearApproved}
            className="flex items-center gap-2 rounded-full bg-[#111111] px-6 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <CheckCircle2 className="h-4 w-4" />
            Clear Approved Artifacts
          </button>
        )}
      </div>

      <div className={`relative flex min-h-[350px] w-full flex-wrap content-start gap-6 rounded-2xl border-2 border-black/10 p-8 transition-colors ${isInspecting ? "border-solid bg-[#F0EEE4] shadow-inner" : "border-dashed bg-black/[0.02]"}`}>
        
        {/* Empty State */}
        {pendingFiles.length === 0 && !isSimulating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <UploadCloud className="mb-4 h-12 w-12 text-black/10" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-black/30">
              Drop materials here for inspection
            </span>
          </div>
        )}

        {/* Simulating State */}
        {isSimulating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div 
              animate={{ rotate: 360 }} 
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className="mb-4 h-8 w-8 rounded-full border-2 border-black/20 border-t-black/60"
            />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-black/40">
              Analyzing structural integrity...
            </span>
          </div>
        )}

        {/* Content State */}
        <AnimatePresence mode="popLayout">
          {pendingFiles.map((file) => {
            if (isInspecting) {
              return (
                <motion.div
                  key={`inspection-${file.id}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: getStatus(file.name) === "PASS" ? 50 : -50 }}
                  className="w-full max-w-[48%]"
                >
                  <InspectionCard file={file} status={getStatus(file.name)} />
                </motion.div>
              );
            }

            return (
              <motion.div
                key={`artifact-${file.id}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              >
                <motion.div
                  drag
                  dragSnapToOrigin
                  onDragEnd={(e, info) => handleDragEnd(e, info, file.id)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <FileArtifact file={file} />
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
