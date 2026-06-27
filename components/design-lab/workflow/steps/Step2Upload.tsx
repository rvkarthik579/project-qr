"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, FileArchive, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { useProjectWorkflow, UploadedFile } from "@/store/useProjectWorkflow";
import JSZip from "jszip";

const spring: any = { type: "spring", stiffness: 400, damping: 28 };

const getFileIcon = (name: string) => {
  if (name.match(/\.(zip|rar|7z)$/i)) return FileArchive;
  if (name.match(/\.(png|jpg|jpeg|svg)$/i)) return ImageIcon;
  if (name.match(/\.(pdf|docx|doc|txt)$/i)) return FileText;
  return FileIcon;
};

export default function Step2Upload() {
  const { setFiles, nextStep } = useProjectWorkflow();
  const [isSimulating, setIsSimulating] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFiles = useCallback(async (filesList: File[]) => {
    if (isSimulating || uploadedFiles.length > 0) return;
    setIsSimulating(true);

    const newFiles: UploadedFile[] = [];
    
    for (const file of filesList) {
      const name = file.name.toLowerCase();
      if (name.endsWith('.zip')) {
        try {
          const zip = await JSZip.loadAsync(file);
          const entriesList = Object.keys(zip.files).filter(p => !zip.files[p].dir && !p.startsWith('__MACOSX'));
          if (entriesList.length > 1000) {
            throw new Error(`Archive contains too many files (${entriesList.length}). Maximum allowed is 1000.`);
          }
          let totalUncompressedSize = 0;
          for (const p of entriesList) {
            const entry = zip.files[p];
            const uncompressedSize = (entry as JSZip.JSZipObject & { _data?: { uncompressedSize?: number } })._data?.uncompressedSize || 0;
            totalUncompressedSize += uncompressedSize;
            if (totalUncompressedSize > 500 * 1024 * 1024) {
              throw new Error(`Archive expands to over 500MB when extracted. This exceeds the safe limit.`);
            }
          }
          const entries = entriesList.map(p => zip.files[p]);
          const extractionPromises = entries.map(async (entry) => {
            const blob = await entry.async('blob');
            const extractedName = entry.name.split('/').pop() || 'file';
            const extractedFile = new File([blob], extractedName, { type: blob.type });
            const ext = extractedName.split('.').pop() || 'txt';
            newFiles.push({
              id: `f-${Math.random().toString(36).substring(2, 9)}`,
              name: entry.name, // Keep full path for tree rendering if needed
              size: Number((extractedFile.size / (1024 * 1024)).toFixed(2)),
              type: ext,
              status: "pending",
              selectedForQR: false,
              file: extractedFile
            });
          });
          await Promise.all(extractionPromises);
        } catch (e) {
          console.error("ZIP extraction error:", e);
        }
      } else {
        const ext = file.name.split('.').pop() || 'txt';
        newFiles.push({
          id: `f-${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          size: Number((file.size / (1024 * 1024)).toFixed(2)),
          type: ext,
          status: "pending",
          selectedForQR: false,
          file
        });
      }
    }

    setUploadedFiles(newFiles);
    setFiles(newFiles);
    setIsSimulating(false);
  }, [isSimulating, uploadedFiles.length, setFiles]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, [processFiles]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFiles(Array.from(e.target.files));
    }
  };

  const hasFiles = uploadedFiles.length > 0;

  return (
    <motion.div className="flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/[0.04] ring-1 ring-black/[0.06]">
      <div className="p-8">
        {/* Dropzone */}
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          onDrop={handleDrop}
          onClick={() => {
            const el = document.getElementById("hidden-file-input");
            if (el) el.click();
          }}
          onMouseEnter={() => !hasFiles && setIsDragOver(true)}
          onMouseLeave={() => setIsDragOver(false)}
          animate={{
            scale: isDragOver ? 1.01 : 1,
            borderColor: isDragOver ? "rgba(0,0,0,0.3)" : hasFiles ? "rgba(46,139,87,0.2)" : "rgba(0,0,0,0.08)",
          }}
          transition={spring}
          className={`relative flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
            hasFiles
              ? "bg-[#F9FAF9]"
              : "cursor-pointer bg-black/[0.015] hover:bg-black/[0.025]"
          }`}
        >
          <AnimatePresence mode="wait">
            {!isSimulating && !hasFiles && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.div
                  animate={{ y: isDragOver ? -4 : 0 }}
                  transition={spring}
                >
                  <UploadCloud className="h-10 w-10 text-black/15" />
                </motion.div>
                <span className="font-sans text-sm font-medium text-black/35">
                  Drop files here or click to upload
                </span>
                <input
                  id="hidden-file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Staggered file list */}
          {hasFiles && (
            <div className="flex w-full flex-col gap-1 p-2">
              <AnimatePresence>
                {uploadedFiles.map((file) => {
                  const Icon = getFileIcon(file.name);
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -16, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="flex items-center gap-3 rounded-lg px-4 py-2.5 hover:bg-black/[0.03] transition-colors"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-black/30" />
                      <span className="font-sans text-sm font-medium text-[#1A1A1A]">{file.name}</span>
                      <span className="ml-auto font-mono text-[10px] font-medium text-black/25">{file.size} MB</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {isSimulating && !hasFiles && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="h-8 w-8 rounded-full border-2 border-black/10 border-t-[#1A1A1A]"
              />
              <span className="font-sans text-sm font-medium text-black/40">Processing...</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      {hasFiles && !isSimulating && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between border-t border-black/[0.04] bg-black/[0.015] px-8 py-5"
        >
          <span className="font-sans text-sm font-medium text-black/40">
            {uploadedFiles.length} files ready for analysis
          </span>
          <motion.button
            onClick={nextStep}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 rounded-full bg-[#2563EB] px-6 py-2.5 font-sans text-sm font-semibold text-white"
          >
            Analyze Files
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}
