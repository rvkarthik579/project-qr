"use client";

import { Inter, Instrument_Serif } from "next/font/google";
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Omniscope from "@/components/design-lab/Omniscope";
import ProjectsList from "@/components/design-lab/ProjectsList";
import ProjectStudio from "@/components/design-lab/ProjectStudio";
import Workbench from "@/components/design-lab/Workbench";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";
import type { DesignLabProject } from "@/components/design-lab/types";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [projects, setProjects] = useState<DesignLabProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<DesignLabProject | null>(null);

  const { triggerRipple } = useCanvasEffect();

  useEffect(() => {
    async function loadProjects() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: projectsData, error } = await supabase
        .from('projects')
        .select(`
          id, machine_name, location, created_at,
          reports(id, files(id, file_name, qr_codes(id)))
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error || !projectsData) {
        console.error("Failed to load projects:", error);
        return;
      }

      const qrIds: string[] = [];
      projectsData.forEach(p => {
        p.reports?.forEach((r: any) => {
          r.files?.forEach((f: any) => {
            f.qr_codes?.forEach((q: any) => {
              if (q.id) qrIds.push(q.id);
            });
          });
        });
      });

      const scanCounts = new Map<string, number>();
      if (qrIds.length > 0) {
        const { data: logs } = await supabase
          .from('scan_logs')
          .select('qr_id')
          .in('qr_id', qrIds);
        
        logs?.forEach(log => {
          scanCounts.set(log.qr_id, (scanCounts.get(log.qr_id) || 0) + 1);
        });
      }

      const mapped = projectsData.map((p: any) => {
        let filesCount = 0;
        let projectScans = 0;
        const fileNames: string[] = [];

        p.reports?.forEach((r: any) => {
          filesCount += (r.files?.length || 0);
          r.files?.forEach((f: any) => {
            if (f.file_name) fileNames.push(f.file_name);
            f.qr_codes?.forEach((q: any) => {
              projectScans += (scanCounts.get(q.id) || 0);
            });
          });
        });

        return {
          id: p.id,
          name: p.machine_name,
          location: p.location,
          fileNames,
          createdDate: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          rawCreatedAt: p.created_at,
          filesCount,
          qrCount: filesCount, // 1 QR per file
          scanCount: projectScans,
          lastActivity: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
        };
      });
      setProjects(mapped);

      // Handle auto-open from URL using searchParams
      const projectIdParam = searchParams.get('project');
      if (projectIdParam) {
        const p = mapped.find((proj: DesignLabProject) => proj.id === projectIdParam);
        if (p) {
          setSelectedProject(p);
          // Remove param from URL cleanly
          router.replace('/dashboard');
        }
      }
      
      const viewParam = searchParams.get('view');
      if (viewParam === 'projects') {
        setIsProjectsOpen(true);
        router.replace('/dashboard');
      }
    }
    loadProjects();
  }, [searchParams, router]);

  useEffect(() => {
    const handleNav = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail === 'projects') {
        setIsProjectsOpen(true);
      } else if (customEvent.detail === 'home') {
        setIsProjectsOpen(false);
        setSelectedProject(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('dashboard-nav', handleNav);
    return () => window.removeEventListener('dashboard-nav', handleNav);
  }, []);

  const handleCreateProject = () => {
    triggerRipple("#4A90E2");
    router.push('/dashboard/new-project');
  };

  return (
    <>
      <ProjectsList 
        isOpen={isProjectsOpen} 
        onClose={() => setIsProjectsOpen(false)} 
        projects={projects} 
        onSelectProject={setSelectedProject} 
      />

      <AnimatePresence>
        {selectedProject && (
          <ProjectStudio
            project={selectedProject}
            onClose={() => {
              setSelectedProject(null);
              setIsProjectsOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <header className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center justify-center pb-24 pt-16 text-center">
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

        {/* Omniscope functional search */}
        <div className="w-full relative z-50">
          <Omniscope
            projects={projects}
            onSelectProject={(project) => {
              setSelectedProject(project);
            }}
          />
        </div>
      </header>

      <section id="recent-projects" className="pb-40 pt-10 scroll-mt-24">
        <div className="mb-12 flex items-baseline justify-between border-b border-black/5 pb-4">
          <h2 className="font-[family-name:var(--font-instrument)] text-3xl text-[#1A1A1A]">
            Recent Projects
          </h2>
          <span className="font-mono text-xs font-medium uppercase tracking-widest text-[#1A1A1A]/40">
            Desk
          </span>
        </div>
        <Workbench projects={projects.slice(0, 6)} onProjectOpen={(id) => {
          const proj = projects.find(p => p.id === id);
          if (proj) setSelectedProject(proj);
        }} />
      </section>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
