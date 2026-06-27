"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ArrowRight, 
  UploadCloud, 
  FileText, 
  CheckCircle2,
  QrCode,
  Download,
  Printer
} from "lucide-react";
import type { DesignLabProject } from "@/components/design-lab/types";
import { useCanvasEffect } from "@/components/design-lab/CanvasEffectContext";

interface ProjectCreationFlowProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (project: DesignLabProject) => void;
}

export default function ProjectCreationFlow({
  isOpen,
  onClose,
  onComplete,
}: ProjectCreationFlowProps) {
  const [step, setStep] = useState(1);
  const { triggerRipple } = useCanvasEffect();

  // Step 1 State
  const [projectName, setProjectName] = useState("");
  
  // Step 2 State
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Step 3 State
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Step 4 State
  // (State removed as unused)

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setUploadedFiles([
        "Maintenance_Report.pdf",
        "Safety_Checklist.pdf",
        "Machine_Manual.pdf",
        "Internal_Notes.txt",
        "Blueprint_v2.docx"
      ]);
      setIsUploading(false);
    }, 1500);
  };

  const handleFileToggle = (file: string) => {
    const next = new Set(selectedFiles);
    if (next.has(file)) next.delete(file);
    else next.add(file);
    setSelectedFiles(next);
  };

  const finishFlow = () => {
    const finalProject: DesignLabProject = {
      id: `proj-${Date.now()}`,
      name: projectName || "Untitled Project",
      createdDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      filesCount: uploadedFiles.length,
      qrCount: selectedFiles.size,
      lastActivity: "Just now"
    };
    triggerRipple("#4A90E2");
    onComplete(finalProject);
  };

  // The paper card aesthetic background
  const paperStyle = {
    boxShadow: "0 12px 40px -12px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(0,0,0,0.03)",
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.025'/%3E%3C/svg%3E\")",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-[#F9F9F8] pb-32"
        >
          <div className="mx-auto max-w-4xl px-8 py-12">
            
            {/* Header */}
            <div className="mb-16 flex items-center justify-between">
              <div className="flex gap-4 items-baseline">
                <h2 className="font-[family-name:var(--font-instrument)] text-5xl text-[#1A1A1A]">
                  New Project
                </h2>
                <span className="font-mono text-xs uppercase tracking-widest text-black/30">
                  Step {step} of 5
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full bg-black/5 p-3 transition-colors hover:bg-black/10"
              >
                <X className="h-6 w-6 text-black/60" />
              </button>
            </div>

            {/* Workspace Area */}
            <motion.div 
              className="relative flex min-h-[500px] flex-col rounded-2xl bg-[#FCFCFA] p-12"
              style={paperStyle}
              layout
            >
              <AnimatePresence mode="wait">
                
                {/* STEP 1: PROJECT DETAILS */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-10"
                  >
                    <div>
                      <label className="mb-3 block font-mono text-xs font-bold uppercase tracking-widest text-black/40">Project Name</label>
                      <input 
                        type="text" 
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g. Boiler Room Audit" 
                        autoFocus
                        className="w-full border-b border-black/10 bg-transparent py-4 font-[family-name:var(--font-instrument)] text-5xl text-black outline-none transition-colors focus:border-black/40 placeholder:text-black/10"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-10 mt-4">
                      <div>
                        <label className="mb-3 block font-mono text-xs font-bold uppercase tracking-widest text-black/40">Machine Name</label>
                        <input type="text" placeholder="e.g. Generator Alpha" className="w-full border-b border-black/10 bg-transparent py-2 text-xl font-medium text-black outline-none transition-colors focus:border-black/40 placeholder:text-black/20" />
                      </div>
                      <div>
                        <label className="mb-3 block font-mono text-xs font-bold uppercase tracking-widest text-black/40">Location</label>
                        <input type="text" placeholder="e.g. Sector 7G" className="w-full border-b border-black/10 bg-transparent py-2 text-xl font-medium text-black outline-none transition-colors focus:border-black/40 placeholder:text-black/20" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: UPLOAD FILES */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex h-full flex-col flex-1"
                  >
                    <div className="mb-8">
                      <h3 className="font-[family-name:var(--font-instrument)] text-4xl text-black">Upload Files</h3>
                      <p className="mt-2 text-black/50 font-medium">Drag and drop folders, PDFs, or images.</p>
                    </div>
                    
                    {uploadedFiles.length === 0 ? (
                      <div 
                        onClick={handleSimulateUpload}
                        className={`flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed ${isUploading ? "border-blue-400 bg-blue-50/50" : "border-black/10 hover:border-black/30"} transition-all min-h-[300px]`}
                      >
                        {isUploading ? (
                          <motion.div 
                            animate={{ rotate: 360 }} 
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="mb-4 rounded-full border-2 border-blue-500 border-t-transparent w-10 h-10"
                          />
                        ) : (
                          <UploadCloud className="mb-4 h-12 w-12 text-black/20" />
                        )}
                        <span className="font-mono text-xs uppercase tracking-widest text-black/40 font-bold">
                          {isUploading ? "Processing..." : "Click to Upload"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex-1 rounded-xl border border-black/5 bg-white p-6 shadow-sm min-h-[300px]">
                        <div className="mb-6 flex items-center justify-between border-b border-black/5 pb-4">
                          <span className="font-mono text-xs font-bold uppercase tracking-widest text-black/40">File Tree Preview</span>
                          <span className="rounded-full bg-black/5 px-3 py-1 font-mono text-[10px] font-bold text-black/60">{uploadedFiles.length} Files</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          {uploadedFiles.map((file, i) => (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                              key={file} 
                              className="flex items-center gap-3 rounded-lg border border-transparent p-2 hover:bg-black/5"
                            >
                              <FileText className="h-4 w-4 text-black/40" />
                              <span className="text-sm font-medium">{file}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 3: SELECT QR FILES */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex h-full flex-col flex-1"
                  >
                    <div className="mb-8">
                      <h3 className="font-[family-name:var(--font-instrument)] text-4xl text-black">Select QR Files</h3>
                      <p className="mt-2 text-black/50 font-medium">Choose which files will receive a dedicated QR code.</p>
                    </div>

                    <div className="flex flex-col gap-3">
                      {uploadedFiles.map((file, i) => {
                        const isSelected = selectedFiles.has(file);
                        return (
                          <motion.div 
                            key={file}
                            onClick={() => handleFileToggle(file)}
                            className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${isSelected ? "border-black bg-black text-white" : "border-black/10 hover:border-black/30 bg-white"}`}
                          >
                            <div className={`flex h-5 w-5 items-center justify-center rounded-md border ${isSelected ? "border-white bg-white" : "border-black/20"}`}>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-black" />}
                            </div>
                            <FileText className={`h-5 w-5 ${isSelected ? "text-white/60" : "text-black/40"}`} />
                            <span className="text-base font-medium">{file}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: QR CONFIGURATION */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex h-full flex-col flex-1"
                  >
                    <div className="mb-8">
                      <h3 className="font-[family-name:var(--font-instrument)] text-4xl text-black">Batch Configuration</h3>
                      <p className="mt-2 text-black/50 font-medium">These settings will apply to the {selectedFiles.size} selected QR codes.</p>
                    </div>

                    <div className="flex flex-col gap-6 rounded-xl border border-black/5 bg-white p-8 shadow-sm">
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/40">Next Inspection Date</label>
                          <input type="date" className="w-full rounded-md border border-black/10 p-3 font-mono text-sm outline-none focus:border-black" />
                        </div>
                        <div>
                          <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/40">Expiry Date</label>
                          <input type="date" className="w-full rounded-md border border-black/10 p-3 font-mono text-sm outline-none focus:border-black" />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/40">Status</label>
                          <select className="w-full rounded-md border border-black/10 p-3 font-mono text-sm outline-none focus:border-black bg-transparent">
                            <option>Pass</option>
                            <option>Fail</option>
                            <option>Under Maintenance</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/40">Optional PIN</label>
                          <input type="text" placeholder="e.g. 1234" className="w-full rounded-md border border-black/10 p-3 font-mono text-sm outline-none focus:border-black placeholder:text-black/20" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-widest text-black/40">Remarks / Notes</label>
                        <textarea rows={2} className="w-full rounded-md border border-black/10 p-3 text-sm outline-none focus:border-black placeholder:text-black/20" placeholder="Optional notes..."></textarea>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: SUCCESS / GENERATE */}
                {step === 5 && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-full flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="mb-8 rounded-full bg-green-500/10 p-6">
                      <QrCode className="h-16 w-16 text-green-600" />
                    </div>
                    <h3 className="font-[family-name:var(--font-instrument)] text-6xl text-black mb-4">
                      {selectedFiles.size} QR Codes Generated
                    </h3>
                    <p className="mb-12 text-lg text-black/50">Your files are securely stored and mapped.</p>

                    <div className="flex gap-4">
                      <button className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest hover:bg-black/5 transition-colors">
                        <Download className="h-4 w-4" /> PDF Sheet
                      </button>
                      <button className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest hover:bg-black/5 transition-colors">
                        <Printer className="h-4 w-4" /> Print Labels
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Navigation Footer */}
              <div className="mt-16 flex items-center justify-between border-t border-black/5 pt-8">
                {step > 1 && step < 5 ? (
                  <button onClick={prevStep} className="font-mono text-xs font-bold uppercase tracking-widest text-black/40 hover:text-black">
                    Back
                  </button>
                ) : <div />}

                {step < 5 ? (
                  <button 
                    onClick={nextStep}
                    disabled={step === 2 && uploadedFiles.length === 0 || step === 3 && selectedFiles.size === 0}
                    className="flex items-center gap-2 rounded-full bg-[#111111] px-8 py-3 text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <span className="font-mono text-xs font-bold uppercase tracking-widest">
                      {step === 4 ? "Generate QR Codes" : "Continue"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button 
                    onClick={finishFlow}
                    className="flex items-center gap-2 rounded-full bg-[#4A90E2] px-8 py-4 text-white shadow-lg transition-all hover:scale-105 active:scale-95"
                  >
                    <span className="font-mono text-sm font-bold uppercase tracking-widest">
                      Open Project Studio
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
