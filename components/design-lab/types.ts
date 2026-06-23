export interface DesignLabFile {
  id: string;
  name: string;
  type: "pdf" | "spreadsheet" | "document";
  projectName: string;
  createdDate: string;
  expiryDate: string;
  uploadedBy: string;
  status: "Active" | "Expired" | "Needs Attention";
  date: string;
  rotation: number;
  yOffset: number;
  xOffset: number;
  scans: number;
  lastScan: string;
  scanTrend: number[];
  recentActivity: string[];
  qrUniqueId?: string;
  filePath?: string;
}

export interface DesignLabProject {
  id: string;
  name: string;
  createdDate: string;
  filesCount: number;
  qrCount: number;
  lastActivity: string;
  scanCount?: number;
  rawCreatedAt?: string;
  location?: string;
  fileNames?: string[];
}
