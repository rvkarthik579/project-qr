"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QrCode, Sparkles } from "lucide-react";
import type { WorkspaceFile } from "./CreateProjectWorkspace";

interface BrassCrucibleProps {
  files: WorkspaceFile[];
  setFiles: React.Dispatch<React.SetStateAction<WorkspaceFile[]>>;
}

export default function BrassCrucible({ files }: BrassCrucibleProps) {
  const convertedFiles = files.filter(f => f.isConverted);
  const [pulseKey, setPulseKey] = useState(0);

  // Trigger pulse animation when a new file is converted
  useEffect(() => {
    if (convertedFiles.length > 0) {
      setPulseKey(prev => prev + 1);
    }
  }, [convertedFiles.length]);

  return (
    <div className="relative flex h-[500px] w-[500px] flex-col items-center justify-center">
      
      {/* Outer Ring */}
      <div className="absolute inset-0 rounded-full border border-[#C5A059]/20" />
      <div className="absolute inset-8 rounded-full border border-[#C5A059]/40 border-dashed" />
      
      {/* Pulse Effect */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pulseKey}
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-16 rounded-full bg-[#C5A059]/20"
        />
      </AnimatePresence>

      {/* Core Crucible */}
      <div className="relative z-10 flex h-64 w-64 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#C5A059] to-[#8C6D31] shadow-[0_20px_50px_rgba(197,160,89,0.3),_inset_0_2px_10px_rgba(255,255,255,0.3)]">
        
        {convertedFiles.length === 0 ? (
          <div className="flex flex-col items-center text-white/80">
            <QrCode className="mb-4 h-16 w-16" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-white">
              Brass Crucible
            </span>
            <span className="mt-2 text-center text-[10px] font-medium uppercase tracking-widest opacity-60">
              Drag Files Here
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-white">
            <Sparkles className="mb-2 h-8 w-8 text-white/80" />
            <span className="font-[family-name:var(--font-instrument)] text-6xl">
              {convertedFiles.length}
            </span>
            <span className="mt-2 font-mono text-[10px] font-bold uppercase tracking-widest opacity-80">
              Artifacts Generated
            </span>
          </div>
        )}

      </div>

      {/* Roster of converted items floating around or listed below?
          Let's just show a simple list below the crucible. */}
      <div className="absolute -bottom-12 flex w-full flex-col items-center">
        {convertedFiles.length > 0 && (
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#C5A059]">
            {convertedFiles.length} files currently in crucible
          </span>
        )}
      </div>

    </div>
  );
}
