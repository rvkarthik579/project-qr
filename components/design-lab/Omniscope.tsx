"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder } from "lucide-react";
import type { DesignLabProject } from "@/components/design-lab/types";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";

interface OmniscopeProps {
  onFocusChange?: (focused: boolean) => void;
  projects?: DesignLabProject[];
  onSelectProject?: (project: DesignLabProject) => void;
}

export default function Omniscope({ onFocusChange, projects = [], onSelectProject }: OmniscopeProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { triggerRipple } = useCanvasEffect();

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
        onFocusChange?.(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onFocusChange]);

  const filteredProjects = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    return projects.filter(p => 
      p.name.toLowerCase().includes(q)
    ).slice(0, 5); // show up to 5 results
  }, [query, projects]);

  return (
    <motion.div 
      layout 
      ref={containerRef}
      className="relative z-40 mx-auto px-8"
      animate={{
        maxWidth: isFocused ? "100%" : "56rem", // max-w-4xl is 56rem
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Search projects, machines..."
          className="w-full bg-transparent text-center font-[family-name:var(--font-instrument)] text-3xl text-[#1A1A1A] outline-none transition-all duration-500 ease-out placeholder:text-[#1A1A1A]/20 md:text-4xl lg:text-5xl"
        />

        {/* Elegant Underline indicating active focus */}
        <motion.div
          layout
          className="mx-auto mt-8 h-[1px] bg-black/10 transition-all duration-700 ease-out"
          animate={{
            width: isFocused ? "100%" : "40%",
            backgroundColor: isFocused ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.1)",
            boxShadow: isFocused ? "0 0 40px 2px rgba(0,0,0,0.1)" : "none",
          }}
        />

        <AnimatePresence>
          {isFocused && query && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-1/2 mt-4 w-full max-w-2xl -translate-x-1/2 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-2xl backdrop-blur-xl"
            >
              {filteredProjects.length === 0 ? (
                <div className="py-8 text-center text-sm text-black/40">No projects found for "{query}"</div>
              ) : (
                <div className="space-y-2">
                  {filteredProjects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        triggerRipple("#4A90E2");
                        onSelectProject?.(p);
                        setIsFocused(false);
                        setQuery("");
                      }}
                      className="flex w-full items-center gap-4 rounded-xl p-3 text-left transition-colors hover:bg-black/5"
                    >
                      <div className="rounded-lg bg-black/5 p-2">
                        <Folder className="h-5 w-5 text-black/60" />
                      </div>
                      <div>
                        <div className="font-medium text-[#1A1A1A]">{p.name}</div>
                        <div className="font-mono text-[10px] text-black/40">
                          {p.filesCount} Files • {p.qrCount} QR Codes
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
