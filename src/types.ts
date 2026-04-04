import type { ReactNode } from "react";

export interface DomainEntry {
  domain: string;
  text: string | string[];
  related_nist_policies: NistPolicyEntry[];
}

export interface NistPolicyEntry {
  id: string;
  content: string;
}

export interface GapResult {
  domain: string;
  status: "processing" | "completed" | "failed";
  gaps?: string[];
}

export interface GapAnalysisCache {
  status: GapResult["status"];
  results: GapResult[];
  message?: string;
  updatedAt: number;
}

export interface GapCacheResult {
  domain: string;
  gaps?: string[];
}

export interface UploadResult {
  file_id: string;
  result: DomainEntry[];
  extracted_text: string;
}

export interface UploadPdfRequest {
  file: File;
  domain?: string;
}

export interface AnalyzeGapsRequest {
  domainData: DomainEntry[];
}

export interface GapAnalysisResponse {
  status: GapResult["status"];
  message?: string;
  results?: GapResult[];
  completed?: number;
  total?: number;
  error?: string;
}

export interface RevisedPolicyRequest {
  text: string;
  gapAnalysis: string;
}

export interface RecheckPolicyRequest {
  revisedPolicy: string;
  gaps: string;
}

export interface RecheckPolicyResponse {
  message?: string;
  remainingGaps?: string[];
}

export interface RoadmapRequest {
  inputPolicy: string;
  revisedPolicy: string;
}

export interface PdfDownloadOptions {
  title: string;
  content: string;
  fileName: string;
}

export interface ErrorBannerProps {
  message: string;
  action?: ReactNode;
}

export interface GeneratorPanelProps {
  header: ReactNode;
  action: ReactNode;
  children: ReactNode;
}

export interface HomeUploadPanelProps {
  onSuccess: (data: UploadResult) => void;
}

export interface UploadProps {
  onSuccess: (data: UploadResult) => void;
}

export interface ResultsDomainDetailsProps {
  domain: DomainEntry;
  activeDomainIdx: number;
  activeNist: number;
  activeGapData?: GapResult;
}

export interface ResultsSidebarProps {
  domains: DomainEntry[];
  activeDomainIdx: number;
  onSelectDomain: (index: number) => void;
  totalNist: number;
  getDomainGapData: (domainName: string) => GapResult | undefined;
}

export interface StreamingTextProps {
  text: string;
  id: string;
  speed?: number;
  start?: boolean;
  onComplete?: () => void;
}

export interface StreamingTextRunnerProps {
  text: string;
  speed: number;
  start: boolean;
  onComplete?: () => void;
  isCached: boolean;
  storageKey: string;
}

export interface AppTopBarProps {
  section?: string;
  actions?: ReactNode;
}

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
}