"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Edit, LogOut, Key, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function AccountPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string>("Loading...");
  const [userInitial, setUserInitial] = useState<string>("?");

  useEffect(() => {
    async function loadUser() {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        setUserInitial(user.email.charAt(0).toUpperCase());
      } else {
        setUserEmail("Not logged in");
      }
    }
    if (isOpen) {
      loadUser();
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

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
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-[480px] flex-col border-l border-black/10 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-black/5 bg-[#F9F9F8]/50 p-8">
              <div>
                <h2 className="font-[family-name:var(--font-instrument)] text-4xl text-[#1A1A1A]">
                  Account
                </h2>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-black/40">
                  Your Profile
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-black/5 p-3 transition-colors hover:bg-black/10"
              >
                <X className="h-5 w-5 text-black/60" />
              </button>
            </div>

            <div className="flex-1 space-y-12 overflow-y-auto p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#1A1A1A] text-white shadow-lg text-4xl font-[family-name:var(--font-instrument)]">
                  {userInitial}
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-instrument)] text-3xl text-[#1A1A1A]">
                    {userEmail.split('@')[0]}
                  </h3>
                  <p className="text-sm text-black/60">{userEmail}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button className="flex items-center gap-3 rounded-xl bg-black/5 p-4 transition-colors hover:bg-black/10">
                  <Edit className="h-4 w-4 text-black/60" />
                  <span className="text-sm font-medium">Edit Profile</span>
                </button>
                <button className="flex items-center gap-3 rounded-xl bg-black/5 p-4 transition-colors hover:bg-black/10">
                  <Key className="h-4 w-4 text-black/60" />
                  <span className="text-sm font-medium">Change Password</span>
                </button>
              </div>

              <div className="pt-4">
                <button onClick={handleSignOut} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-900/10 py-4 text-red-600 transition-colors hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  <span className="font-mono text-[11px] font-medium uppercase tracking-widest">
                    Logout
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
