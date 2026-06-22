"use client";

import { Inter, Instrument_Serif } from "next/font/google";
import { useState } from "react";
import LivingCanvas from "@/components/design-lab/LivingCanvas";
import SettingsPanel from "@/components/design-lab/SettingsPanel";
import AccountPanel from "@/components/design-lab/AccountPanel";
import FloatingDock from "@/components/design-lab/FloatingDock";
import { CanvasEffectProvider } from "@/components/design-lab/CanvasEffectContext";
import { ToastProvider } from "@/components/design-lab/ToastProvider";
import { useRouter } from "next/navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
});

export default function DashboardClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const router = useRouter();

  const openAccount = () => {
    setIsAccountOpen(true);
    setIsSettingsOpen(false);
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
    setIsAccountOpen(false);
  };

  const openProjects = () => {
    setIsSettingsOpen(false);
    setIsAccountOpen(false);
    router.push("/dashboard?view=projects");
  };

  const goHome = () => {
    setIsSettingsOpen(false);
    setIsAccountOpen(false);
    router.push("/dashboard");
  };

  return (
    <CanvasEffectProvider>
      <ToastProvider>
        <div
          className={`relative min-h-screen overflow-x-hidden bg-[#F9F9F8] text-[#1A1A1A] ${inter.variable} ${instrumentSerif.variable} font-sans selection:bg-black selection:text-white`}
        >
          <LivingCanvas />

          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
          <AccountPanel
            isOpen={isAccountOpen}
            onClose={() => setIsAccountOpen(false)}
          />

          <FloatingDock
            openProjects={openProjects}
            openAccount={openAccount}
            openSettings={openSettings}
            goHome={goHome}
          />

          <main className="relative z-10 mx-auto w-full max-w-6xl pt-32">
            {children}
          </main>
        </div>
      </ToastProvider>
    </CanvasEffectProvider>
  );
}
