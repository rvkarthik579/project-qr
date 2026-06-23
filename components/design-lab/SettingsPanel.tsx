"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Shield, HardDrive, AlertTriangle, QrCode } from "lucide-react";
import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const router = useRouter();
  const [totalFiles, setTotalFiles] = useState(0);
  const [usedCapacity, setUsedCapacity] = useState(0); // in bytes
  const [projectCount, setProjectCount] = useState(0);
  const [qrCount, setQrCount] = useState(0);
  const [userName, setUserName] = useState("Loading...");
  const [userEmail, setUserEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.full_name || 'Authenticated User');
      setUserEmail(user.email || '');

      const { data: files } = await supabase.from('files').select('file_size').eq('user_id', user.id);
      if (files) {
        setTotalFiles(files.length);
        const size = files.reduce((acc, f) => acc + (f.file_size || 0), 0);
        setUsedCapacity(size);
      }

      const { count: projCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      if (projCount !== null) setProjectCount(projCount);

      const { count: qCount } = await supabase.from('qr_codes').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      if (qCount !== null) setQrCount(qCount);
    }
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleDeleteAllProjects = async () => {
    if (!confirm('Are you sure you want to delete ALL projects? This cannot be undone.')) return;
    setIsDeleting(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('projects').delete().eq('user_id', user.id);
    }
    setIsDeleting(false);
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your entire account? This cannot be undone.')) return;
    setIsDeleting(true);
    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('qr_codes').delete().eq('user_id', user.id);
      await supabase.from('reports').delete().eq('user_id', user.id);
      await supabase.from('projects').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);
    }
    setIsDeleting(false);
    router.push('/login');
  };

  const gbUsed = (usedCapacity / (1024 * 1024 * 1024)).toFixed(2);
  const percentUsed = Math.min(100, (usedCapacity / (10 * 1024 * 1024 * 1024)) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[#F9F9F8]/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-xl bg-white border-l border-black/10 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-8 border-b border-black/5 bg-[#F9F9F8]/50">
              <div>
                <h2 className="font-[family-name:var(--font-instrument)] text-4xl text-[#1A1A1A]">Settings</h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/40 mt-2">Preferences</p>
              </div>
              <button 
                onClick={onClose}
                className="rounded-full bg-black/5 p-3 transition-colors hover:bg-black/10"
              >
                <X className="h-5 w-5 text-black/60" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-16">
              

              {/* Profile */}
              <section>
                <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-2">
                  <div className="h-4 w-4 rounded-full bg-black/10 flex items-center justify-center">
                    <span className="text-[8px] font-bold">{userName.charAt(0)}</span>
                  </div>
                  <h3 className="font-mono text-[11px] uppercase tracking-widest font-bold text-black/60">Profile</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-black/80">{userName}</span>
                    <span className="text-xs text-black/50">{userEmail}</span>
                  </div>
                </div>
              </section>

              {/* Metrics */}
              <section>
                <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-2">
                  <HardDrive className="h-4 w-4 text-black/40" />
                  <h3 className="font-mono text-[11px] uppercase tracking-widest font-bold text-black/60">Metrics & Storage</h3>
                </div>
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="flex flex-col">
                    <span className="text-4xl font-[family-name:var(--font-instrument)] text-[#1A1A1A]">{projectCount}</span>
                    <span className="font-mono text-[10px] tracking-widest text-black/40">TOTAL PROJECTS</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-4xl font-[family-name:var(--font-instrument)] text-[#1A1A1A]">{qrCount}</span>
                    <span className="font-mono text-[10px] tracking-widest text-black/40">TOTAL QR CODES</span>
                  </div>
                </div>


                <div className="space-y-6">
                  <div className="flex items-end justify-between">
                    <div className="flex flex-col">
                      <span className="text-4xl font-[family-name:var(--font-instrument)] text-[#1A1A1A]">{gbUsed} GB</span>
                      <span className="font-mono text-[10px] tracking-widest text-black/40">USED CAPACITY</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-4xl font-[family-name:var(--font-instrument)] text-[#1A1A1A]">{totalFiles}</span>
                      <span className="font-mono text-[10px] tracking-widest text-black/40">TOTAL FILES</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1A1A1A]" style={{ width: `${percentUsed}%` }} />
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-black/30">
                    <span>0 GB</span>
                    <span>10.0 GB Limit</span>
                  </div>
                </div>
              </section>

              {/* Danger Zone */}
              <section>
                <div className="flex items-center gap-3 mb-6 border-b border-red-900/10 pb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <h3 className="font-mono text-[11px] uppercase tracking-widest font-bold text-red-600">Danger Zone</h3>
                </div>
                <div className="space-y-3">
                  <button onClick={handleDeleteAllProjects} disabled={isDeleting} className="w-full text-left p-4 rounded-lg border border-red-900/10 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                    <span className="block text-sm font-medium">Delete All Projects</span>
                    <span className="block text-xs opacity-70 mt-1">Clear all project data from the system</span>
                  </button>
                  <button onClick={handleDeleteAccount} disabled={isDeleting} className="w-full text-left p-4 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                    <span className="block text-sm font-medium">Delete Account</span>
                    <span className="block text-xs opacity-80 mt-1">Permanently erase all data and identity</span>
                  </button>
                </div>
              </section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
