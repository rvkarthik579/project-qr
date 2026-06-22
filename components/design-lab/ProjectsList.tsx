"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Filter, Folder, Edit2, Trash2, Clock } from "lucide-react";
import type { DesignLabProject } from "@/components/design-lab/types";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";

interface ProjectsListProps {
  isOpen: boolean;
  onClose: () => void;
  projects: DesignLabProject[];
  onSelectProject: (project: DesignLabProject) => void;
}

export default function ProjectsList({
  isOpen,
  onClose,
  projects,
  onSelectProject,
}: ProjectsListProps) {
  const [filter, setFilter] = useState("All");
  const { triggerRipple } = useCanvasEffect();

  const paperStyle = {
    boxShadow:
      "0 12px 40px -12px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.03)",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.025'/%3E%3C/svg%3E\")",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-40 overflow-y-auto bg-[#F9F9F8] pb-32"
        >
          <div className="mx-auto max-w-6xl px-8 py-12">
            <div className="mb-16 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-instrument)] text-6xl text-[#1A1A1A]">
                All Projects
              </h2>
              <button
                onClick={onClose}
                className="rounded-full bg-black/5 p-3 transition-colors hover:bg-black/10"
              >
                <X className="h-6 w-6 text-black/60" />
              </button>
            </div>

            <div className="mb-12 flex items-center gap-4">
              <div className="flex flex-1 items-center gap-3 rounded-full border border-black/10 bg-white px-6 py-4 shadow-sm">
                <Search className="h-5 w-5 text-black/40" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-black/30"
                />
              </div>
              <div className="flex gap-2">
                {["All", "Recent", "Most Scanned", "Newest", "Oldest"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`rounded-full px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${
                      filter === f
                        ? "bg-[#1A1A1A] text-white"
                        : "bg-white text-black/60 hover:bg-black/5"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 transition-colors hover:bg-black/5">
                <Filter className="h-4 w-4 text-black/60" />
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                  More
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              {projects.map((p, i) => {
                const rotation = i % 2 === 0 ? 1.5 : -1.5;
                const yOffset = i % 3 === 0 ? 4 : -2;

                return (
                  <motion.div
                    key={p.id}
                    layoutId={`project-card-${p.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: yOffset, rotate: rotation }}
                    whileHover={{
                      scale: 1.03,
                      y: yOffset - 12,
                      rotate: 0,
                      transition: { type: "spring", stiffness: 400, damping: 20 },
                    }}
                    transition={{
                      delay: i * 0.1,
                      type: "spring",
                      stiffness: 200,
                      damping: 20,
                    }}
                    onClick={() => {
                      triggerRipple("#4A90E2");
                      onSelectProject(p);
                      onClose();
                    }}
                    className="group relative flex cursor-pointer flex-col rounded-xl bg-[#FCFCFA] p-8"
                    style={paperStyle}
                  >
                    <div className="mb-12 flex items-start justify-between">
                      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                        <Folder className="h-8 w-8 text-[#1A1A1A]/80" />
                      </div>
                      <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          className="rounded-full bg-white p-3 text-black/70 shadow-md transition-transform hover:scale-110 hover:text-black active:scale-95"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Edit2 className="h-4 w-4 text-black/50" />
                        </button>
                        <button
                          className="rounded-full bg-white p-3 text-red-500/70 shadow-md transition-transform hover:scale-110 hover:text-red-600 active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerRipple("#FF6B6B");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <motion.div layoutId={`project-content-${p.id}`}>
                      <h4 className="font-[family-name:var(--font-instrument)] text-2xl text-[#1A1A1A] group-hover:text-black">
                        {p.name}
                      </h4>

                      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-black/5 pt-6 md:grid-cols-4">
                        <div>
                          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">
                            Created
                          </p>
                          <p className="text-sm font-medium">{p.createdDate}</p>
                        </div>
                        <div>
                          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">
                            Files
                          </p>
                          <p className="text-sm font-medium">{p.filesCount}</p>
                        </div>
                        <div>
                          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-black/40">
                            QR Codes
                          </p>
                          <p className="text-sm font-medium">{p.qrCount}</p>
                        </div>
                        <div>
                          <p className="mb-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-black/40">
                            <Clock className="h-3 w-3" />
                            Last Activity
                          </p>
                          <p className="text-sm font-medium">{p.lastActivity}</p>
                        </div>
                      </div>
                    </motion.div>

                    <div className="absolute inset-0 -z-10 translate-y-1 scale-[0.98] rounded-xl border border-black/5 bg-[#FCFCFA] opacity-50 shadow-sm" />
                    <div className="absolute inset-0 -z-20 translate-y-2 scale-[0.96] rounded-xl border border-black/5 bg-[#FCFCFA] opacity-25 shadow-sm" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
