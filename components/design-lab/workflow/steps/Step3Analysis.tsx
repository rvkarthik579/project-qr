/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowDown, AlertTriangle, XCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useProjectWorkflow, UploadedFile } from "@/store/useProjectWorkflow";

const spring: any = { type: "spring", stiffness: 400, damping: 28 };

export default function Step3Analysis() {
  const { files, updateFileStatus, nextStep } = useProjectWorkflow();
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const isAnalyzing = analyzedCount < files.length;

  const passCount = files.filter(f => f.status === "PASS").length;
  const attentionCount = files.filter(f => f.status === "ATTENTION").length;
  const errorCount = files.filter(f => f.status === "ERROR").length;

  useEffect(() => {
    const analyze = async () => {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await new Promise(r => setTimeout(r, 450));

        let status: UploadedFile["status"] = "PASS";
        if (file.name.endsWith(".rar") || file.name.endsWith(".7z")) status = "ATTENTION";
        if (file.name.endsWith(".exe") || file.name.endsWith(".bat") || file.name.endsWith(".sh")) status = "ERROR";

        updateFileStatus(file.id, status);
        setAnalyzedCount(i + 1);
      }
    };
    analyze();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canProceed = !isAnalyzing && errorCount === 0;

  return (
    <motion.div className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/[0.04] ring-1 ring-black/[0.06]">
      {/* Header with live counters */}
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <h2 className="font-sans text-lg font-bold text-[#1A1A1A]">Source Material Analysis</h2>
          <p className="mt-0.5 font-sans text-sm font-medium text-black/40">
            Verifying format compatibility
          </p>
        </div>

        {/* Live rolling counters */}
        <div className="flex items-center gap-3">
          {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin text-black/30" />}
          <div className="flex items-center gap-1.5 rounded-full bg-[#2E8B57]/10 px-2.5 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-[#2E8B57]" />
            <motion.span
              key={passCount}
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-mono text-xs font-bold text-[#2E8B57]"
            >
              {passCount}
            </motion.span>
          </div>
          {attentionCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#F59E0B]/10 px-2.5 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
              <motion.span
                key={attentionCount}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-mono text-xs font-bold text-[#D97706]"
              >
                {attentionCount}
              </motion.span>
            </div>
          )}
          {errorCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-[#DC2626]/10 px-2.5 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-[#DC2626]" />
              <motion.span
                key={errorCount}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="font-mono text-xs font-bold text-[#DC2626]"
              >
                {errorCount}
              </motion.span>
            </div>
          )}
        </div>
      </div>

      {/* Analysis cards */}
      <div className="flex flex-col gap-2 px-8 pb-6">
        {files.map((file, i) => (
          <AnalysisCard key={file.id} file={file} index={i} />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-black/[0.04] bg-black/[0.015] px-8 py-5">
        <span className="font-sans text-sm font-medium text-black/40">
          {isAnalyzing
            ? `Analyzing ${analyzedCount}/${files.length}...`
            : errorCount > 0
            ? "Remove errored files or re-upload in a supported format."
            : `${passCount} files ready to proceed`}
        </span>
        <motion.button
          onClick={nextStep}
          disabled={!canProceed}
          whileHover={canProceed ? { scale: 1.02 } : {}}
          whileTap={canProceed ? { scale: 0.97 } : {}}
          className="flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-2.5 font-sans text-sm font-semibold text-white transition-opacity disabled:opacity-20"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// --- Analysis Card (expandable) ---
function AnalysisCard({ file, index }: { file: UploadedFile; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isPending = file.status === "pending";
  const isPass = file.status === "PASS";
  const isAttention = file.status === "ATTENTION";
  const isError = file.status === "ERROR";
  const hasExpandable = isAttention && (file.type === "rar" || file.type === "7z");

  // Auto-expand attention items
  useEffect(() => {
    if (hasExpandable) {
      const timer = setTimeout(() => setIsExpanded(true), 200);
      return () => clearTimeout(timer);
    }
  }, [hasExpandable]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.06 }}
      onClick={() => hasExpandable && setIsExpanded(!isExpanded)}
      className={`rounded-xl border p-4 transition-colors ${
        isPending ? "border-black/5 bg-black/[0.01]" :
        isPass ? "border-[#2E8B57]/15 bg-[#2E8B57]/[0.03]" :
        isAttention ? "border-[#F59E0B]/20 bg-[#F59E0B]/[0.04] cursor-pointer" :
        "border-[#DC2626]/15 bg-[#DC2626]/[0.03]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`font-sans text-sm font-semibold ${isError ? "line-through text-black/40" : "text-[#1A1A1A]"}`}>
          {file.name}
        </span>

        <div className="flex items-center gap-1.5">
          {isPending && (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-4 w-4 rounded-full border border-black/10 border-t-black/40" />
          )}
          {isPass && <CheckCircle2 className="h-4 w-4 text-[#2E8B57]" />}
          {isAttention && <AlertTriangle className="h-4 w-4 text-[#D97706]" />}
          {isError && <XCircle className="h-4 w-4 text-[#DC2626]" />}
          <span className={`font-sans text-xs font-semibold ${
            isPending ? "text-black/30" :
            isPass ? "text-[#2E8B57]" :
            isAttention ? "text-[#D97706]" :
            "text-[#DC2626]"
          }`}>
            {isPending ? "Scanning" : file.status === "ATTENTION" ? "Attention" : file.status}
          </span>
        </div>
      </div>

      {/* Expandable conversion guide for RAR / 7Z */}
      <AnimatePresence>
        {isExpanded && hasExpandable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-lg bg-white/60 p-4">
              <p className="mb-3 font-sans text-xs font-semibold text-[#D97706]/80">
                Retriqo builds file trees from ZIP archives. Convert this {file.type.toUpperCase()} to proceed:
              </p>
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-[#D97706]">
                <span className="rounded bg-[#F59E0B]/10 px-2 py-1">{file.type.toUpperCase()}</span>
                <ArrowDown className="h-3 w-3 -rotate-90 opacity-50" />
                <span className="rounded bg-[#F59E0B]/10 px-2 py-1">Extract</span>
                <ArrowDown className="h-3 w-3 -rotate-90 opacity-50" />
                <span className="rounded bg-[#F59E0B]/10 px-2 py-1">ZIP</span>
                <ArrowDown className="h-3 w-3 -rotate-90 opacity-50" />
                <span className="rounded bg-[#F59E0B]/10 px-2 py-1">Upload</span>
                <ArrowDown className="h-3 w-3 -rotate-90 opacity-50" />
                <span className="rounded bg-[#D97706] px-2 py-1 text-white">Generate QR</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {isError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 font-sans text-xs font-medium text-[#DC2626]/70"
        >
          Executables and system files are not permitted.
        </motion.p>
      )}
    </motion.div>
  );
}

