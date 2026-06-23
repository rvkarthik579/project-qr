"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Filter, Folder, Edit2, Trash2, Clock } from "lucide-react";
import type { DesignLabProject } from "@/components/design-lab/types";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface ProjectsListProps {
  isOpen: boolean;
  onClose: () => void;
  projects: DesignLabProject[];
  onSelectProject: (project: DesignLabProject) => void;
}

const ProjectsList = React.memo(function ProjectsList({
  isOpen,
  onClose,
  projects,
  onSelectProject,
}: ProjectsListProps) {
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { triggerRipple } = useCanvasEffect();

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchName = p.name?.toLowerCase().includes(query);
    const matchLocation = p.location?.toLowerCase().includes(query);
    const matchFiles = p.fileNames?.some((fn) => fn.toLowerCase().includes(query));
    return matchName || matchLocation || matchFiles;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (filter) {
      case "Newest":
        return new Date(b.rawCreatedAt || 0).getTime() - new Date(a.rawCreatedAt || 0).getTime();
      case "Oldest":
        return new Date(a.rawCreatedAt || 0).getTime() - new Date(b.rawCreatedAt || 0).getTime();
      case "Most Scanned":
        return (b.scanCount || 0) - (a.scanCount || 0);
      case "Recent":
      case "All":
      default:
        // Recent relies on last activity (currently created_at for phase 1, but we use it as recent)
        // Or if 'All', maintain default sort
        return 0; // The default array from parent is already sorted by newest, so we'll just rely on `rawCreatedAt` or let it be
    }
  });

  // Explicitly for Recent
  if (filter === "Recent") {
    sortedProjects.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setIsDeleting(projectId);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.from("projects").delete().eq("id", projectId);
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete project:", err);
      alert("Failed to delete project");
      setIsDeleting(null);
    }
  };

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

            <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              {/* Filter controls without search input (Omniscope handles search) */}
              <div className="flex gap-2 flex-wrap">
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
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
                  <input
                    type="text"
                    placeholder="Search projects, locations, files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-black/10 bg-white py-3 pl-10 pr-4 font-sans text-sm text-black placeholder:text-black/40 outline-none transition-colors focus:border-black/30"
                  />
                </div>
                <button className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 transition-colors hover:bg-black/5 shrink-0">
                  <Filter className="h-4 w-4 text-black/60" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-black/60">
                    More
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
              {sortedProjects.map((p, i) => {
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
                          className="rounded-full bg-white p-3 text-red-500/70 shadow-md transition-transform hover:scale-110 hover:text-red-600 active:scale-95 disabled:opacity-50"
                          disabled={isDeleting === p.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerRipple("#FF6B6B");
                            handleDeleteProject(p.id);
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
});

export default ProjectsList;
