"use client";

import { Inter, Instrument_Serif } from "next/font/google";
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import LivingCanvas from "@/components/design-lab/LivingCanvas";
import Omniscope from "@/components/design-lab/Omniscope";
import SettingsPanel from "@/components/design-lab/SettingsPanel";
import AccountPanel from "@/components/design-lab/AccountPanel";
import FloatingDock from "@/components/design-lab/FloatingDock";
import Workbench from "@/components/design-lab/Workbench";
import ProjectsList from "@/components/design-lab/ProjectsList";
import ProjectStudio from "@/components/design-lab/ProjectStudio";
import CreateProjectWorkflow from "@/components/design-lab/workflow/CreateProjectWorkflow";
import {
  CanvasEffectProvider,
  useCanvasEffect,
} from "@/components/design-lab/CanvasEffectContext";
import { ToastProvider, useToast } from "@/components/design-lab/ToastProvider";
import type { DesignLabProject } from "@/components/design-lab/types";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
});

const MOCK_PROJECTS: DesignLabProject[] = [
  {
    id: "proj-m7",
    name: "Machine 7 Inspection",
    createdDate: "Oct 12, 2023",
    filesCount: 12,
    qrCount: 12,
    lastActivity: "2h ago",
  },
  {
    id: "proj-br",
    name: "Boiler Room Audit",
    createdDate: "Nov 05, 2023",
    filesCount: 8,
    qrCount: 8,
    lastActivity: "Yesterday",
  },
  {
    id: "proj-gm",
    name: "Generator Maintenance",
    createdDate: "Jan 15, 2024",
    filesCount: 21,
    qrCount: 21,
    lastActivity: "4h ago",
  },
];

export default function DesignLab() {
  return (
    <CanvasEffectProvider>
      <ToastProvider>
        <DesignLabInner />
      </ToastProvider>
    </CanvasEffectProvider>
  );
}

function DesignLabInner() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isCreationFlowOpen, setIsCreationFlowOpen] = useState(false);
  const [projects, setProjects] = useState<DesignLabProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<DesignLabProject | null>(null);

  useEffect(() => {
    async function loadProjects() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Fallback to mock data if not logged in (for prototype preview)
        setProjects(MOCK_PROJECTS);
        return;
      }

      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          id, machine_name, created_at,
          reports(id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !projectsData) {
        console.error("Failed to load projects:", error);
        setProjects(MOCK_PROJECTS);
        return;
      }

      const mapped = projectsData.map((p: { id: string, machine_name: string, created_at: string, reports: unknown[] }) => ({
        id: p.id,
        name: p.machine_name,
        createdDate: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        filesCount: p.reports?.length || 0,
        qrCount: p.reports?.length || 0, // Mocked for now until we join qr_codes
        lastActivity: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      }));
      setProjects(mapped);
    }
    loadProjects();
  }, []);

  const { triggerRipple } = useCanvasEffect();
  useToast();

  const openAccount = () => {
    setIsAccountOpen(true);
    setIsSettingsOpen(false);
    setIsProjectsOpen(false);
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
    setIsAccountOpen(false);
    setIsProjectsOpen(false);
  };

  const openProjects = () => {
    setIsProjectsOpen(true);
    setIsAccountOpen(false);
    setIsSettingsOpen(false);
    setIsCreationFlowOpen(false);
  };

  const goHome = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsAccountOpen(false);
    setIsSettingsOpen(false);
    setIsProjectsOpen(false);
    setIsCreationFlowOpen(false);
    setSelectedProject(null);
  };

  const handleCreateProject = () => {
    triggerRipple("#4A90E2");
    setIsCreationFlowOpen(true);
  };

  const handleProjectCreated = (newProject: DesignLabProject) => {
    setIsCreationFlowOpen(false);
    setProjects((prev) => [...prev, newProject]);
    setSelectedProject(newProject);
  };

  // showDimOverlay was previously used here

  return (
      <div
        className={`relative min-h-screen overflow-x-hidden bg-[#F9F9F8] text-[#1A1A1A] ${inter.variable} ${instrumentSerif.variable} font-sans selection:bg-black selection:text-white`}
      >
        <LivingCanvas />

        <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <AccountPanel isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
        <ProjectsList isOpen={isProjectsOpen} onClose={() => setIsProjectsOpen(false)} projects={projects} onSelectProject={setSelectedProject} />

        <AnimatePresence>
          {selectedProject && (
            <ProjectStudio
              project={selectedProject}
              onClose={() => setSelectedProject(null)}
            />
          )}
        </AnimatePresence>

        <CreateProjectWorkflow 
          isOpen={isCreationFlowOpen} 
          onClose={() => setIsCreationFlowOpen(false)} 
          onComplete={handleProjectCreated}
        />

        <FloatingDock
          openProjects={openProjects}
          openAccount={openAccount}
          openSettings={openSettings}
          goHome={goHome}
        />

        <header className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center justify-center pb-24 pt-48 text-center">
          <h1 className="mb-6 font-[family-name:var(--font-instrument)] text-8xl text-[#1A1A1A] tracking-tight md:text-9xl">
            Retriqo
          </h1>
          
          <div className="max-w-2xl mx-auto flex flex-col items-center">
            <h2 className="mb-10 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-[#1A1A1A]">
              Industrial File Tracking & QR Documentation
            </h2>
            <p className="text-lg font-medium leading-relaxed text-[#1A1A1A]/70 max-w-xl">
              Store inspection reports, manuals, certificates and documentation.<br/>
              Generate QR codes for selected files and access them instantly from any machine by scanning.
            </p>
          </div>

          <div className="mt-14 mb-14 flex items-center justify-center gap-4 rounded-full border border-black/[0.06] bg-black/[0.02] px-8 py-3.5 text-xs font-mono tracking-[0.15em] uppercase text-black/30 backdrop-blur-sm">
            <span className="text-[#1A1A1A] font-bold">Create Project</span>
            <span>—</span>
            <span className="text-[#1A1A1A] font-bold">Upload Files</span>
            <span>—</span>
            <span className="text-[#1A1A1A] font-bold">Generate QR Codes</span>
          </div>


          <button
            onClick={handleCreateProject}
            className="mb-24 flex items-center gap-2 rounded-full bg-[#111111] px-10 py-4 text-white shadow-[0_10px_20px_-10px_rgba(0,0,0,0.3)] transition-transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            <span className="font-mono text-sm font-bold uppercase tracking-widest">
              Create Project
            </span>
          </button>

          <div className="w-full">
            <Omniscope onFocusChange={() => {}} />
          </div>
        </header>

        <main className="relative mx-auto w-full max-w-6xl space-y-40 px-8 pb-40">
          <section>
            <div className="mb-12 flex items-baseline justify-between border-b border-black/5 pb-4">
              <h2 className="font-[family-name:var(--font-instrument)] text-3xl text-[#1A1A1A]">
                Recent Projects
              </h2>
              <span className="font-mono text-xs font-medium uppercase tracking-widest text-[#1A1A1A]/40">
                Desk
              </span>
            </div>
            {/* Workbench acts as Recent Projects */}
            <Workbench projects={projects.slice(0,3)} onProjectOpen={(id) => {
              const proj = projects.find(p => p.id === id);
              if (proj) setSelectedProject(proj);
            }} />
          </section>
        </main>
      </div>
  );
}
