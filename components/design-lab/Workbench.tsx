"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Folder } from "lucide-react";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";
import type { DesignLabProject } from "@/components/design-lab/types";

interface WorkbenchProps {
  projects: DesignLabProject[];
  onProjectOpen: (id: string) => void;
}

const Workbench = React.memo(function Workbench({ projects, onProjectOpen }: WorkbenchProps) {
  const deskRef = useRef<HTMLDivElement>(null);
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const { triggerRipple } = useCanvasEffect();

  const paperStyle = {
    boxShadow:
      "0 4px 20px -4px rgba(0,0,0,0.05), 0 0 1px rgba(0,0,0,0.1)",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.025'/%3E%3C/svg%3E\")",
  };

  return (
    <>
      <div className="relative z-20 w-full">
        <div
          ref={deskRef}
          className="relative flex min-h-[400px] flex-wrap items-start justify-center gap-8 py-12"
        >
          {projects.map((project, i) => {
            // Generalize offsets and rotation for up to 6 items
            const rotation = (i % 2 === 0 ? -1 : 1) * ((i % 3) + 1);
            const xOffset = i % 2 === 0 ? -4 * (i % 3) : 6 * (i % 3);
            const yOffset = i % 2 === 0 ? 6 : -4;
            
            let displayClass = "flex";
            if (i >= 4) displayClass = "max-lg:hidden flex";
            else if (i >= 2) displayClass = "max-md:hidden flex";

            return (
              <motion.div
                key={project.id}
                layoutId={`project-card-${project.id}`}
                drag
                dragConstraints={deskRef}
                dragElastic={0.1}
                onDragStart={() => setDraggedProject(project.id)}
                onDragEnd={() => setDraggedProject(null)}
                initial={{ rotate: rotation, x: xOffset, y: yOffset }}
                animate={{
                  opacity: draggedProject && draggedProject !== project.id ? 0.3 : 1,
                  rotate: rotation,
                  x: xOffset,
                  y: yOffset,
                  scale: draggedProject && draggedProject !== project.id ? 0.95 : 1,
                }}
                whileDrag={{
                  scale: 1.05,
                  rotate: 0,
                  cursor: "grabbing",
                  zIndex: 50,
                }}
                whileHover={{
                  scale: 1.02,
                  rotate: 0,
                  y: yOffset - 10,
                  zIndex: 40,
                  transition: { type: "spring", stiffness: 400, damping: 25 },
                }}
                onClick={() => {
                  triggerRipple("#4A90E2");
                  onProjectOpen(project.id);
                }}
                className={`group relative h-72 w-64 cursor-grab flex-col bg-[#FFFFFF] p-6 transition-shadow hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] ${displayClass}`}
                style={paperStyle}
              >
                <div className="absolute right-0 top-0 h-8 w-8 bg-gradient-to-bl from-black/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <motion.div layoutId={`project-content-${project.id}`} className="flex h-full flex-col w-full">
                  <div className="mb-4 flex items-start justify-between border-b border-black/5 pb-3">
                    <div className="rounded-lg border border-black/5 bg-white p-2.5 shadow-sm">
                      <Folder className="h-6 w-6 text-[#1A1A1A]/80" />
                    </div>
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-black/40">
                      Project
                    </span>
                  </div>

                  <motion.h4
                    className="mb-3 font-[family-name:var(--font-instrument)] text-2xl leading-tight text-[#1A1A1A]"
                  >
                    {project.name}
                  </motion.h4>

                  <div className="mt-2 space-y-1">
                    <p className="font-mono text-[10px] text-black/60">{project.filesCount} Files</p>
                    <p className="font-mono text-[10px] text-black/60">{project.qrCount} QR Codes</p>
                  </div>

                  <div className="mt-auto border-t border-black/5 pt-4">
                    <div className="flex flex-col gap-1">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-black/30">
                        Last Activity: {project.lastActivity}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-black/30">
                        Created: {project.createdDate}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </>
  );
});

export default Workbench;
