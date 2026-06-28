/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, QrCode, Download, CheckCircle2 } from "lucide-react";
import { useProjectWorkflow } from "@/store/useProjectWorkflow";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";
import { generateQRId } from "@/lib/qr";
import type { DesignLabProject } from "@/components/design-lab/types";

const GENERATION_STEPS = [
  "Analyzing file structure...",
  "Encoding QR data...",
  "Preparing labels...",
  "Finalizing output...",
];

const spring: any = { type: "spring", stiffness: 400, damping: 28 };

export default function Step7Generate({ onComplete }: { onComplete: (p: DesignLabProject) => void }) {
  const { files, projectName, location, qrConfig } = useProjectWorkflow();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [createdProject, setCreatedProject] = useState<DesignLabProject | null>(null);
  const [generating, setGenerating] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const validFilesCount = files.filter(f => f.status === "PASS").length;
  const selectedCount = files.filter(f => f.selectedForQR).length;

  useEffect(() => {
    if (isFinished || generating) return;
    
    async function executeGeneration() {
      setGenerating(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not logged in");

        setCompletedSteps([0]); // Analyzing file structure...

        // 1. Create Project
        const { data: projectRecord, error: projErr } = await supabase
          .from('projects')
          .insert({
            user_id: user.id,
            machine_name: projectName || "Unnamed Project",
            location: location || null,
            project_type: "Other", // Default for now
          })
          .select('id, machine_name, created_at')
          .single();

        if (projErr) throw new Error(projErr.message);

        setCompletedSteps([0, 1]); // Encoding QR data...

        // 2. Create Report
        const { data: report, error: repErr } = await supabase
          .from('reports')
          .insert({
            project_id: projectRecord.id,
            user_id: user.id,
            status: 'pass', // Default all pass
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (repErr) throw new Error(repErr.message);

        setCompletedSteps([0, 1, 2]); // Preparing labels...

        // 3. Process Files
        const filesToProcess = files.filter(f => f.status === "PASS" || f.status === "ATTENTION");
        
        let fileCount = 0;
        for (const f of filesToProcess) {
          if (!f.file) continue;

          // Upload to storage
          const { path: storagePath, error: uploadErr } = await uploadFile(
            f.file, user.id, projectRecord.id, report.id
          );
          
          if (uploadErr) throw new Error(uploadErr);

          // Insert file record
          const { data: fileRecord, error: fileErr } = await supabase
            .from('files')
            .insert({
              report_id: report.id,
              file_name: f.name,
              file_path: storagePath,
              file_type: f.type || 'application/octet-stream',
              file_size: f.file.size,
            })
            .select('id')
            .single();

          if (fileErr) throw new Error(fileErr.message);

          // Insert QR if selected
          if (f.selectedForQR) {
            const qrUniqueId = generateQRId();
            const { error: qrErr } = await supabase
              .from('qr_codes')
              .insert({
                file_id: fileRecord.id,
                report_id: report.id,
                user_id: user.id,
                qr_unique_id: qrUniqueId,
                is_active: true,
              });
            if (qrErr) throw new Error(qrErr.message);
          }
          fileCount++;
        }

        setCompletedSteps([0, 1, 2, 3]); // Finalizing output...

        // Prepare return object
        const newProj: DesignLabProject = {
          id: projectRecord.id,
          name: projectRecord.machine_name,
          createdDate: new Date(projectRecord.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          filesCount: fileCount,
          qrCount: selectedCount,
          lastActivity: new Date(projectRecord.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        };

        setCreatedProject(newProj);
        setTimeout(() => setIsFinished(true), 400);

      } catch (err: unknown) {
        console.error("Generation failed:", err);
        // You might want to handle error state UI here
      } finally {
        setGenerating(false);
      }
    }

    executeGeneration();
  }, [isFinished, generating, files, projectName, location, qrConfig, selectedCount]);

  return (
    <motion.div className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/[0.04] ring-1 ring-black/[0.06]">
      <div className="flex flex-col items-center justify-center px-8 py-16 text-center min-h-[360px]">
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex w-full max-w-sm flex-col gap-3"
            >
              {GENERATION_STEPS.map((step, i) => {
                const isDone = completedSteps.includes(i);
                const isActive = completedSteps.length === i;

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: i * 0.08 }}
                    className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors ${
                      isDone ? "bg-[#2E8B57]/[0.04]" : isActive ? "bg-black/[0.03]" : ""
                    }`}
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                      {isDone ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                          <CheckCircle2 className="h-4 w-4 text-[#2E8B57]" />
                        </motion.div>
                      ) : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                          className="h-4 w-4 rounded-full border-[1.5px] border-black/10 border-t-black/60"
                        />
                      ) : (
                        <div className="h-1.5 w-1.5 rounded-full bg-black/10" />
                      )}
                    </div>
                    <span className={`font-sans text-sm font-medium transition-colors ${
                      isDone ? "text-[#1A1A1A]" : isActive ? "text-[#1A1A1A]" : "text-black/30"
                    }`}>
                      {step}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={spring}
              className="flex w-full flex-col items-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#2E8B57]/10"
              >
                <QrCode className="h-10 w-10 text-[#2E8B57]" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-sans text-3xl font-bold text-[#1A1A1A]"
              >
                {selectedCount} QR Code{selectedCount !== 1 ? "s" : ""} Generated
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-3 font-sans text-base font-medium text-black/50"
              >
                {projectName} is fully documented and ready.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-8 flex gap-8 rounded-xl border border-black/[0.06] bg-[#FAFAF9] px-8 py-5"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-xl font-bold text-[#1A1A1A]">{validFilesCount}</span>
                  <span className="font-sans text-xs font-semibold uppercase tracking-wider text-black/40">Files Uploaded</span>
                </div>
                <div className="h-10 w-px bg-black/[0.06]" />
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono text-xl font-bold text-[#1A1A1A]">{selectedCount}</span>
                  <span className="font-sans text-xs font-semibold uppercase tracking-wider text-black/40">QR Codes</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-10 flex w-full justify-center gap-4 border-t border-black/[0.04] pt-8"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-2.5 font-sans text-sm font-semibold text-[#1A1A1A] transition-colors hover:bg-black/[0.02]"
                >
                  <Download className="h-4 w-4 text-black/40" /> Download PDF
                </motion.button>
                
                <motion.button
                  onClick={() => createdProject && onComplete(createdProject)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-2.5 font-sans text-sm font-semibold text-white shadow-lg shadow-blue-500/20"
                >
                  Open Project Studio <ArrowRight className="h-4 w-4" />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

