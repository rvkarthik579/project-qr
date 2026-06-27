"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, AlertTriangle, ArrowRight } from "lucide-react";
import type { WorkspaceConfig } from "./CreateProjectWorkspace";

interface ToolPaletteProps {
  config: WorkspaceConfig;
  setConfig: React.Dispatch<React.SetStateAction<WorkspaceConfig>>;
  onApprove: () => void;
}

export default function ToolPalette({ config, setConfig, onApprove }: ToolPaletteProps) {
  const [logoSize, setLogoSize] = useState(20);
  const [showError, setShowError] = useState(false);

  const handleLogoSizeChange = (val: number) => {
    if (val > 35) {
      // Too large, breaks readability
      setShowError(true);
      setTimeout(() => setShowError(false), 2000);
      return;
    }
    setLogoSize(val);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-[#1A1A1A]">
          Tool Palette
        </h4>
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2 rounded-full bg-[#FFBF00]/20 px-4 py-1 text-[#C08D00]"
            >
              <AlertTriangle className="h-4 w-4" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                ERROR CORRECTION OVERRIDE DENIED
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-4 gap-4">
        
        {/* Color Configuration */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-black/40">
            Dye
          </label>
          <div className="flex gap-2">
            {["#000000", "#2A52BE", "#811331", "#2E8B57"].map((color) => (
              <button
                key={color}
                onClick={() => setConfig(prev => ({ ...prev, color }))}
                className={`h-6 w-6 rounded-full border-2 ${config.color === color ? "border-black scale-110" : "border-transparent"}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Logo Integration */}
        <div className="flex flex-col gap-2 col-span-2">
          <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-black/40 flex justify-between">
            <span>Center Seal (Logo)</span>
            {logoSize > 30 && <span className="text-[#FFBF00]">Approaching Limit</span>}
          </label>
          <div className="flex items-center gap-3">
            <button className="flex h-8 items-center justify-center rounded-md border border-black/10 bg-black/5 px-4 font-mono text-[10px] font-bold text-black/60 hover:bg-black/10 transition-colors">
              <ImageIcon className="mr-2 h-4 w-4" /> Upload
            </button>
            <input 
              type="range" 
              min="10" max="40" 
              value={logoSize}
              onChange={(e) => handleLogoSizeChange(Number(e.target.value))}
              className={`flex-1 accent-black ${logoSize > 30 ? "accent-[#FFBF00]" : ""}`}
            />
          </div>
        </div>

        {/* Structure / Error Correction */}
        <div className="flex flex-col gap-2">
          <label className="font-mono text-[9px] font-bold uppercase tracking-widest text-black/40">
            Structure
          </label>
          <select 
            value={config.errorCorrection}
            onChange={(e) => setConfig(prev => ({ ...prev, errorCorrection: e.target.value }))}
            className="h-8 rounded-md border border-black/10 bg-black/5 px-2 font-mono text-[10px] font-bold outline-none"
          >
            <option value="Low">Low Redundancy</option>
            <option value="Medium">Standard Redundancy</option>
            <option value="High">High Redundancy</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end pt-4 border-t border-black/10">
        <button
          onClick={onApprove}
          className="flex items-center gap-2 rounded-full bg-[#2A52BE] px-8 py-3 text-white transition-all hover:bg-[#1E3A8A] active:scale-95 shadow-md"
        >
          <span className="font-mono text-xs font-bold uppercase tracking-widest">
            Approve Blueprint
          </span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
}
