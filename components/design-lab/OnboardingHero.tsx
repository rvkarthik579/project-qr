"use client";

import React from "react";
import { motion } from "framer-motion";
import { FolderPlus, Upload, QrCode, Printer, Smartphone } from "lucide-react";

import type { DesignLabProject } from "@/components/design-lab/types";

type OnboardingHeroProps = {
  projects: DesignLabProject[];
};

const STEPS = [
  { icon: FolderPlus, label: "Create Project", color: "#4A90E2" },
  { icon: Upload, label: "Upload Files", color: "#50C9B0" },
  { icon: QrCode, label: "Generate QR", color: "#F5A623" },
  { icon: Printer, label: "Print QR", color: "#1A1A1A" },
  { icon: Smartphone, label: "Scan Anytime", color: "#4CD964" },
];

export default function OnboardingHero({ projects }: OnboardingHeroProps) {
  if (projects && projects.length > 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto mb-20 px-8"
    >
      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute top-8 left-[10%] right-[10%] h-px bg-black/10" />

        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: "easeOut" }}
            className="relative flex flex-col items-center text-center z-10"
          >
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-16 h-16 rounded-2xl bg-white shadow-md border border-black/5 flex items-center justify-center mb-3"
              style={{ boxShadow: `0 4px 20px -6px ${step.color}40` }}
            >
              <step.icon className="h-6 w-6" style={{ color: step.color }} />
            </motion.div>
            <span className="font-mono text-[10px] tracking-widest uppercase text-black/50 font-medium whitespace-nowrap">
              {step.label}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
