const fs = require('fs');

function applyStudioFix() {
  let code = fs.readFileSync('components/design-lab/ProjectStudio.tsx', 'utf8');

  // Add copiedQR state
  if (!code.includes('const [copiedQR, setCopiedQR]')) {
    code = code.replace(
      'const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);',
      `const [isGeneratingPrint, setIsGeneratingPrint] = useState(false);\n  const [copiedQR, setCopiedQR] = useState<string | null>(null);`
    );
  }

  // Add handleFileAction
  if (!code.includes('handleFileAction')) {
    code = code.replace(
      'const handleExport = async (layout: QRLayout) => {',
      `const handleFileAction = async (e: React.MouseEvent, filePath: string, action: 'download' | 'copy' | 'open', fileName: string) => {
    e.stopPropagation();
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.storage
      .from('project-qr-files')
      .createSignedUrl(filePath, 300, action === 'download' ? { download: fileName } : undefined);
    
    if (error || !data) {
      console.error('Failed to generate secure URL', error);
      return;
    }

    if (action === 'open') {
      window.open(data.signedUrl, '_blank');
    } else if (action === 'copy') {
      navigator.clipboard.writeText(data.signedUrl);
      setCopiedQR('file-' + filePath);
      setTimeout(() => setCopiedQR(null), 2000);
    } else if (action === 'download') {
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleExport = async (layout: QRLayout) => {`
    );
  }

  // Update file actions inside the loop
  const oldActions = `<div className="flex items-center gap-3 opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-black/40 group-hover:text-black/80">
                        View Details
                      </span>
                      <div className="rounded-full bg-black/5 p-2 group-hover:bg-black/10 transition-colors">
                        <ArrowRight className="h-4 w-4 text-black/60" />
                      </div>
                    </div>`;
  const newActions = `<div className="flex items-center gap-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <button onClick={(e) => handleFileAction(e, file.filePath, 'download', file.name)} className="text-xs font-medium text-black/50 hover:text-black">
                        Download File
                      </button>
                      <button onClick={(e) => handleFileAction(e, file.filePath, 'copy', file.name)} className="text-xs font-medium text-black/50 hover:text-black">
                        {copiedQR === 'file-' + file.filePath ? 'Copied!' : 'Copy Link'}
                      </button>
                      <button onClick={(e) => handleFileAction(e, file.filePath, 'open', file.name)} className="text-xs font-medium text-black/50 hover:text-black">
                        Open In New Tab
                      </button>
                      <div className="ml-2 rounded-full bg-black/5 p-2 transition-colors hover:bg-black/10">
                        <ArrowRight className="h-4 w-4 text-black/60" />
                      </div>
                    </div>`;

  if (code.includes(oldActions)) {
    code = code.replace(oldActions, newActions);
  } else {
    // maybe spaces are different
    console.log("Could not find old actions block. Will use regex.");
    code = code.replace(/<div className="flex items-center gap-3 opacity-60[^>]+>[\s\S]*?<ArrowRight className="h-4 w-4 text-black\/60" \/>[\s\S]*?<\/div>[\s\S]*?<\/div>/, newActions);
  }

  // Fix back navigation
  // "If ProjectStudio contains navigation controls, ensure closing returns to the Projects list view. Do not redirect users to dashboard home."
  // Wait, ProjectStudio has: `<button onClick={() => { triggerRipple("#1A1A1A"); onClose(); }} ...>Back to Dashboard</button>`
  // onClose already calls `setActiveProject(null)` in page.tsx which returns them to the list!
  // I will just change the text from "Back to Dashboard" to "Back to Projects List"
  code = code.replace('>Back to Dashboard<', '>Back to Projects List<');

  fs.writeFileSync('components/design-lab/ProjectStudio.tsx', code);
  console.log("ProjectStudio updated");
}

function applyFileDetailFix() {
  let code = fs.readFileSync('components/design-lab/FileDetailPanel.tsx', 'utf8');

  // Fix download logic
  const oldDownload = `const downloadFile = async () => {
    if (!file.filePath) return;
    setIsDownloadingFile(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.storage.from('project_files').download(file.filePath);
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download file", err);
      alert("Failed to download file");
    } finally {
      setIsDownloadingFile(false);
    }
  };`;

  const newDownload = `const downloadFile = async () => {
    if (!file.filePath) return;
    setIsDownloadingFile(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.storage.from('project-qr-files').createSignedUrl(file.filePath, 300, { download: file.name });
      if (error || !data) throw error;
      
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download file", err);
      alert("Failed to download file");
    } finally {
      setIsDownloadingFile(false);
    }
  };`;

  code = code.replace(oldDownload, newDownload);

  fs.writeFileSync('components/design-lab/FileDetailPanel.tsx', code);
  console.log("FileDetailPanel updated");
}

applyStudioFix();
applyFileDetailFix();
