/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Folder, FileText, ChevronRight, CheckCircle2 } from "lucide-react";
import { useProjectWorkflow } from "@/store/useProjectWorkflow";

const spring: any = { type: "spring", stiffness: 400, damping: 28 };

export default function Step4TreeReview() {
  const { files, projectName, nextStep } = useProjectWorkflow();
  const validFiles = files.filter(f => f.status === "PASS");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]));

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isOpen = expandedFolders.has("root");

  return (
    <motion.div className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/[0.04] ring-1 ring-black/[0.06]">
      <div className="flex items-center justify-between px-8 py-6">
        <div>
          <h2 className="font-sans text-lg font-bold text-[#1A1A1A]">File Tree Review</h2>
          <p className="mt-0.5 font-sans text-sm font-medium text-black/40">
            Verify the project hierarchy before generating QR codes.
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-[#2E8B57]/10 px-2.5 py-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#2E8B57]" />
          <span className="font-mono text-xs font-bold text-[#2E8B57]">{validFiles.length} nodes</span>
        </div>
      </div>

      <div className="px-8 pb-6">
        <div className="rounded-xl border border-black/[0.06] bg-[#FAFAF9] p-5">
          {/* Root folder */}
          <motion.button
            onClick={() => toggleFolder("root")}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-black/[0.03]"
          >
            <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={spring}>
              <ChevronRight className="h-4 w-4 text-black/30" />
            </motion.div>
            <Folder className={`h-4 w-4 ${isOpen ? "text-[#2A52BE]" : "text-black/30"}`} />
            <span className="font-sans text-sm font-semibold text-[#1A1A1A]">
              {projectName || "Project Root"}
            </span>
          </motion.button>

          {/* Children */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring}
                className="ml-5 mt-1 flex flex-col gap-0.5 overflow-hidden border-l border-black/[0.06] pl-4"
              >
                {validFiles.map((file, i) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...spring, delay: i * 0.04 }}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-black/[0.03]"
                  >
                    <FileText className="h-3.5 w-3.5 text-black/25" />
                    <span className="font-sans text-sm font-medium text-black/70">{file.name}</span>
                    <span className="ml-auto font-mono text-[10px] font-medium text-black/20">{file.size} MB</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex justify-end border-t border-black/[0.04] bg-black/[0.015] px-8 py-5">
        <motion.button
          onClick={nextStep}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-2.5 font-sans text-sm font-semibold text-white"
        >
          Confirm Structure <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

