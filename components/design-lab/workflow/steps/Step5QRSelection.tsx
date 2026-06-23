"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, QrCode } from "lucide-react";
import { useProjectWorkflow } from "@/store/useProjectWorkflow";

const spring: any = { type: "spring", stiffness: 400, damping: 28 };

export default function Step5QRSelection() {
  const { files, toggleQRSelection, nextStep } = useProjectWorkflow();
  const validFiles = files.filter(f => f.status === "PASS");
  const selectedCount = validFiles.filter(f => f.selectedForQR).length;

  return (
    <motion.div className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/[0.04] ring-1 ring-black/[0.06]">
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <h2 className="font-sans text-lg font-bold text-[#1A1A1A]">QR Selection</h2>
          <p className="mt-0.5 font-sans text-sm font-medium text-black/40">
            Choose which files will receive QR codes.
          </p>
        </div>

        {/* Live counter */}
        <motion.div
          layout
          className="flex items-center gap-2 rounded-full bg-[#1A1A1A] px-3 py-1.5"
        >
          <QrCode className="h-3.5 w-3.5 text-white/60" />
          <motion.span
            key={selectedCount}
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-mono text-xs font-bold text-white"
          >
            {selectedCount}
          </motion.span>
          <span className="font-sans text-xs font-medium text-white/40">selected</span>
        </motion.div>
      </div>

      <div className="flex flex-col gap-1.5 px-8 pb-6">
        <div className="mb-4 flex items-center justify-between rounded-xl bg-black/[0.02] px-4 py-3 border border-black/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                validFiles.forEach(f => { if (!f.selectedForQR) toggleQRSelection(f.id); });
              }}
              className="font-sans text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A] transition-colors hover:text-[#2563EB]"
            >
              Select All
            </button>
            <div className="h-3 w-[1px] bg-black/10"></div>
            <button
              onClick={() => {
                validFiles.forEach(f => { if (f.selectedForQR) toggleQRSelection(f.id); });
              }}
              className="font-sans text-[11px] font-bold uppercase tracking-widest text-black/40 transition-colors hover:text-[#EF4444]"
            >
              Clear All
            </button>
          </div>
          <span className="font-mono text-xs font-semibold text-black/40">
            {selectedCount} / {validFiles.length} Selected
          </span>
        </div>

        {validFiles.map((file, i) => {
          const isSelected = file.selectedForQR;
          return (
            <motion.button
              key={file.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.04 }}
              onClick={() => toggleQRSelection(file.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                isSelected
                  ? "border-[#1A1A1A] bg-[#1A1A1A]/[0.03]"
                  : "border-black/[0.06] hover:border-black/15 hover:bg-black/[0.01]"
              }`}
            >
              {/* Checkbox */}
              <motion.div
                animate={{
                  backgroundColor: isSelected ? "#1A1A1A" : "transparent",
                  borderColor: isSelected ? "#1A1A1A" : "rgba(0,0,0,0.15)",
                }}
                transition={spring}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-[1.5px]"
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </motion.div>

              <span className={`font-sans text-sm font-medium transition-colors ${isSelected ? "text-[#1A1A1A]" : "text-black/60"}`}>
                {file.name}
              </span>
              <span className="ml-auto font-mono text-[10px] font-medium text-black/20">{file.size} MB</span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex justify-end border-t border-black/[0.04] bg-black/[0.015] px-8 py-5">
        <motion.button
          onClick={nextStep}
          disabled={selectedCount === 0}
          whileHover={selectedCount > 0 ? { scale: 1.02 } : {}}
          whileTap={selectedCount > 0 ? { scale: 0.97 } : {}}
          className="flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-2.5 font-sans text-sm font-semibold text-white transition-opacity disabled:opacity-20"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}
