"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useProjectWorkflow } from "@/store/useProjectWorkflow";

interface SummaryCardProps {
  stepIndex: number;
  title: string;
  summary: string;
}

export default function SummaryCard({ stepIndex, title, summary }: SummaryCardProps) {
  const { currentStep, setStep, furthestStep } = useProjectWorkflow();
  
  const isPast = currentStep > stepIndex;
  const canNavigate = stepIndex <= furthestStep;

  if (currentStep === stepIndex) return null;

  return (
    <motion.button
      onClick={() => canNavigate && setStep(stepIndex)}
      disabled={!canNavigate}
      className={`group flex w-full items-center gap-4 rounded-xl px-5 py-4 text-left transition-all ${
        canNavigate
          ? "cursor-pointer hover:bg-black/[0.03]"
          : "cursor-default opacity-40"
      }`}
      whileHover={canNavigate ? { x: 2 } : {}}
      whileTap={canNavigate ? { scale: 0.995 } : {}}
    >
      {/* Step indicator */}
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
        isPast
          ? "bg-[#1A1A1A] text-white"
          : "border border-black/10 text-black/30"
      }`}>
        {isPast ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : stepIndex}
      </div>

      {/* Title + summary */}
      <div className="flex flex-1 items-center justify-between">
        <div>
          <span className={`font-sans text-sm font-semibold ${isPast ? "text-[#1A1A1A]" : "text-black/30"}`}>
            {title}
          </span>
          {isPast && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="font-sans text-xs font-medium text-black/40"
            >
              {summary}
            </motion.p>
          )}
        </div>

        {isPast && canNavigate && (
          <span className="font-sans text-xs font-medium text-black/30 opacity-0 transition-opacity group-hover:opacity-100">
            Edit
          </span>
        )}
      </div>
    </motion.button>
  );
}
