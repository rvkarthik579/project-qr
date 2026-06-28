/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { motion } from "framer-motion";
import { ArrowRight, QrCode } from "lucide-react";
import { useProjectWorkflow } from "@/store/useProjectWorkflow";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";

const spring: any = { type: "spring", stiffness: 400, damping: 28 };

const COLORS = [
  { value: "#000000", label: "Black" },
  { value: "#2A52BE", label: "Steel" },
  { value: "#811331", label: "Oxide" },
  { value: "#2E8B57", label: "Forest" },
];

export default function Step6QRConfig() {
  const { qrConfig, updateQRConfig, nextStep, files } = useProjectWorkflow();
  const { triggerRipple } = useCanvasEffect();
  const selectedCount = files.filter(f => f.selectedForQR).length;

  return (
    <motion.div className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/[0.04] ring-1 ring-black/[0.06]">
      <div className="flex flex-col md:flex-row">
        {/* Config */}
        <div className="flex flex-1 flex-col gap-8 p-8">
          <div>
            <h2 className="font-sans text-lg font-bold text-[#1A1A1A]">QR Configuration</h2>
            <p className="mt-0.5 font-sans text-sm font-medium text-black/40">
              Settings apply to all {selectedCount} selected files.
            </p>
          </div>

          {/* Color */}
          <div>
            <label className="mb-3 block font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-black/35">
              Color
            </label>
            <div className="flex gap-3">
              {COLORS.map(({ value, label }) => (
                <motion.button
                  key={value}
                  onClick={() => updateQRConfig({ color: value })}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.92 }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <motion.div
                    animate={{
                      boxShadow: qrConfig.color === value
                        ? `0 0 0 2px #FAFAF9, 0 0 0 4px ${value}`
                        : "0 0 0 0px transparent",
                    }}
                    transition={spring}
                    className="h-9 w-9 rounded-full"
                    style={{ backgroundColor: value }}
                  />
                  <span className="font-sans text-[10px] font-medium text-black/30">{label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Error Correction */}
          <div>
            <label className="mb-3 block font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-black/35">
              Error Correction
            </label>
            <div className="flex flex-col gap-2">
              {[
                { value: "Low", label: "Low", desc: "Smaller pattern, less redundancy" },
                { value: "Medium", label: "Medium", desc: "Recommended for most uses" },
                { value: "High", label: "High", desc: "Industrial durability, larger pattern" },
              ].map(({ value, label, desc }) => (
                <motion.button
                  key={value}
                  onClick={() => updateQRConfig({ errorCorrection: value })}
                  whileTap={{ scale: 0.99 }}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                    qrConfig.errorCorrection === value
                      ? "border-[#1A1A1A] bg-[#1A1A1A]/[0.03]"
                      : "border-black/[0.06] hover:border-black/15"
                  }`}
                >
                  <div>
                    <span className="font-sans text-sm font-semibold text-[#1A1A1A]">{label}</span>
                    <p className="font-sans text-xs font-medium text-black/35">{desc}</p>
                  </div>
                  {qrConfig.errorCorrection === value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      className="h-2 w-2 rounded-full bg-[#1A1A1A]"
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex w-full flex-col items-center justify-center border-t border-black/[0.04] bg-[#FAFAF9] p-10 md:w-[280px] md:border-l md:border-t-0">
          <span className="mb-6 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-black/25">
            Live Preview
          </span>
          <motion.div
            layout
            transition={spring}
            className="flex h-44 w-44 items-center justify-center rounded-2xl bg-white shadow-sm"
            style={{
              boxShadow: `0 8px 24px -8px ${qrConfig.color}25`,
              border: `1.5px solid ${qrConfig.color}15`,
            }}
          >
            <QrCode
              className="h-28 w-28 transition-colors duration-200"
              style={{ color: qrConfig.color }}
            />
          </motion.div>
          <span className="mt-4 font-mono text-[10px] font-medium text-black/20">
            {qrConfig.errorCorrection} · {selectedCount} codes
          </span>
        </div>
      </div>

      <div className="flex justify-end border-t border-black/[0.04] bg-black/[0.015] px-8 py-5">
        <motion.button
          onClick={() => {
            triggerRipple("#D4A017");
            nextStep();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-2.5 font-sans text-sm font-semibold text-white"
        >
          Generate QR Codes <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

