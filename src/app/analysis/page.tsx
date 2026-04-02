"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import axios from "axios";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { ResultsSidebar } from "@/components/features/analysis/ResultsSidebar";
import { ResultsDomainDetails } from "@/components/features/analysis/ResultsDomainDetails";
import { downloadTextAsPdf } from "@/lib/pdf";
import {
  DomainEntry,
  GapAnalysisCache,
  GapResult,
} from "@/components/features/analysis/types";

const GAP_CACHE_PREFIX = "gapAnalysis:";

const getGapCacheKey = (fileId: string) => `${GAP_CACHE_PREFIX}${fileId}`;

const normalizeDomainName = (domainName: string) => domainName.trim().toLowerCase();

const readGapAnalysisCache = (fileId: string): GapAnalysisCache | null => {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(getGapCacheKey(fileId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const results = Array.isArray(parsed?.results) ? parsed.results : [];
    const status: GapResult["status"] =
      parsed?.status === "completed" ||
      parsed?.status === "failed" ||
      parsed?.status === "processing"
        ? parsed.status
        : "processing";

    return {
      status,
      results,
      message: typeof parsed?.message === "string" ? parsed.message : undefined,
      updatedAt:
        typeof parsed?.updatedAt === "number" ? parsed.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
};

const writeGapAnalysisCache = (
  fileId: string,
  cache: Partial<GapAnalysisCache>,
) => {
  if (typeof window === "undefined") return;

  const existing = readGapAnalysisCache(fileId);
  const nextCache: GapAnalysisCache = {
    status: cache.status ?? existing?.status ?? "processing",
    results: cache.results ?? existing?.results ?? [],
    message: cache.message ?? existing?.message,
    updatedAt: Date.now(),
  };

  localStorage.setItem(getGapCacheKey(fileId), JSON.stringify(nextCache));
};

const getCachedDomains = (): DomainEntry[] => {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("uploadedDomains");
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function ResultsPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeDomainIdx, setActiveDomainIdx] = useState<number>(0);
  const [gapResults, setGapResults] = useState<GapResult[]>([]);
  const [hasRevisedPolicy, setHasRevisedPolicy] = useState(false);
  const [analyzing, setAnalyzing] = useState(true);

  const startedRef = useRef(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gapResultsRef = useRef<GapResult[]>([]);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const updateGapResults = useCallback((nextResults: GapResult[]) => {
    gapResultsRef.current = nextResults;
    setGapResults(nextResults);
  }, []);

  const updateAnalyzing = useCallback((nextAnalyzing: boolean) => {
    setAnalyzing(nextAnalyzing);
  }, []);

  const syncGapState = useCallback(
    (
      fileId: string,
      payload: Partial<GapAnalysisCache> & {
        results?: GapResult[];
        status: GapResult["status"];
      },
    ) => {
      const nextResults = payload.results ?? gapResultsRef.current;
      updateGapResults(nextResults);
      updateAnalyzing(payload.status === "processing");
      writeGapAnalysisCache(fileId, {
        status: payload.status,
        results: nextResults,
        message: payload.message,
      });
    },
    [updateAnalyzing, updateGapResults],
  );

  useEffect(() => {
    const rafId = requestAnimationFrame(() => {
      setIsHydrated(true);
      setDomains(getCachedDomains());
      const fileId = localStorage.getItem("fileId");
      if (fileId && localStorage.getItem(`revisedPolicy:${fileId}`)) {
        setHasRevisedPolicy(true);
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, []);

  const startGapAnalysis = useCallback(
    async (domainData: DomainEntry[], fileId: string) => {
      try {
        updateAnalyzing(true);
        const startRes = await axios.post(
          "http://127.0.0.1:5000/api/analyze-gaps",
          domainData,
        );

        const currentResults = Array.isArray(startRes.data)
          ? startRes.data
          : Array.isArray(startRes.data?.results)
            ? startRes.data.results
            : [];

        const currentStatus: GapResult["status"] =
          startRes.data?.status === "completed" ||
          startRes.data?.status === "failed"
            ? startRes.data.status
            : "processing";

        if (currentResults.length > 0) {
          syncGapState(fileId, {
            status: currentStatus,
            results: currentResults,
            message: startRes.data?.message,
          });
        } else {
          const cached = readGapAnalysisCache(fileId);
          if (cached) {
            queueMicrotask(() => {
              updateGapResults(cached.results);
              updateAnalyzing(cached.status === "processing");
            });
          }

          writeGapAnalysisCache(fileId, {
            status: currentStatus,
            message: startRes.data?.message,
          });
        }

        if (
          currentStatus === "completed" ||
          currentStatus === "failed" ||
          (currentResults.length > 0 &&
            currentResults.every(
              (result: GapResult) =>
                result.status === "completed" || result.status === "failed",
            ))
        ) {
          stopPolling();
          updateAnalyzing(false);
          return;
        }

        stopPolling();
        pollIntervalRef.current = setInterval(async () => {
          try {
            const statusRes = await axios.get(
              "http://127.0.0.1:5000/api/analyze-gaps",
            );

            const polledResults = Array.isArray(statusRes.data?.results)
              ? statusRes.data.results
              : undefined;

            const polledStatus: GapResult["status"] =
              statusRes.data?.status === "completed" ||
              statusRes.data?.status === "failed"
                ? statusRes.data.status
                : "processing";

            if (polledResults) {
              syncGapState(fileId, {
                status: polledStatus,
                results: polledResults,
                message: statusRes.data?.message,
              });
            } else {
              writeGapAnalysisCache(fileId, {
                status: polledStatus,
                message: statusRes.data?.message,
              });
              updateAnalyzing(polledStatus === "processing");
            }

            if (polledStatus === "completed" || polledStatus === "failed") {
              stopPolling();
              updateAnalyzing(false);
            }
          } catch (error) {
            console.error("Polling error:", error);
            stopPolling();
            updateAnalyzing(false);
          }
        }, 15000);
      } catch (error) {
        console.error(error);
        updateAnalyzing(false);
      }
    },
    [syncGapState, updateAnalyzing, updateGapResults],
  );

  useEffect(() => {
    if (!isHydrated || startedRef.current) return;

    if (!domains.length) {
      router.replace("/");
      return;
    }

    startedRef.current = true;
    const fileId = localStorage.getItem("fileId");

    if (!fileId) {
      router.replace("/");
      return;
    }

    const cached = readGapAnalysisCache(fileId);
    if (cached) {
      queueMicrotask(() => {
        updateGapResults(cached.results);
        updateAnalyzing(cached.status === "processing");
      });

      if (cached.status === "completed" || cached.status === "failed") {
        return;
      }
    }

    queueMicrotask(() => {
      void startGapAnalysis(domains, fileId);
    });

    return () => {
      stopPolling();
    };
  }, [
    isHydrated,
    router,
    domains,
    startGapAnalysis,
    updateAnalyzing,
    updateGapResults,
  ]);

  const domainWiseDomains = useMemo(() => {
    const grouped = new Map<
      string,
      {
        domain: string;
        text: string[];
        relatedNistById: Map<string, DomainEntry["related_nist_policies"][number]>;
      }
    >();

    for (const domain of domains) {
      if (!domain?.domain) continue;

      const key = normalizeDomainName(domain.domain);
      const existing = grouped.get(key);
      const domainTexts = Array.isArray(domain.text)
        ? domain.text
        : typeof domain.text === "string"
          ? [domain.text]
          : [];

      if (existing) {
        for (const chunkText of domainTexts) {
          if (chunkText) {
            existing.text.push(chunkText);
          }
        }

        for (const policy of domain.related_nist_policies ?? []) {
          if (!policy?.id) continue;
          existing.relatedNistById.set(policy.id, policy);
        }

        continue;
      }

      const relatedNistById = new Map<
        string,
        DomainEntry["related_nist_policies"][number]
      >();

      for (const policy of domain.related_nist_policies ?? []) {
        if (!policy?.id) continue;
        relatedNistById.set(policy.id, policy);
      }

      grouped.set(key, {
        domain: domain.domain,
        text: [...domainTexts],
        relatedNistById,
      });
    }

    return Array.from(grouped.values()).map((entry) => ({
      domain: entry.domain,
      text: entry.text,
      related_nist_policies: Array.from(entry.relatedNistById.values()),
    }));
  }, [domains]);

  const domainWiseGapMap = useMemo(() => {
    const grouped = new Map<
      string,
      {
        domain: string;
        hasProcessing: boolean;
        hasCompleted: boolean;
        hasFailed: boolean;
        gaps: Set<string>;
      }
    >();

    for (const result of gapResults) {
      if (!result?.domain) continue;

      const key = normalizeDomainName(result.domain);
      const existing = grouped.get(key);

      if (existing) {
        existing.hasProcessing ||= result.status === "processing";
        existing.hasCompleted ||= result.status === "completed";
        existing.hasFailed ||= result.status === "failed";

        if (Array.isArray(result.gaps)) {
          for (const gap of result.gaps) {
            if (gap) {
              existing.gaps.add(gap);
            }
          }
        }

        continue;
      }

      grouped.set(key, {
        domain: result.domain,
        hasProcessing: result.status === "processing",
        hasCompleted: result.status === "completed",
        hasFailed: result.status === "failed",
        gaps: new Set(
          Array.isArray(result.gaps)
            ? result.gaps.filter(Boolean)
            : []
        ),
      });
    }

    const map = new Map<string, GapResult>();
    grouped.forEach((entry, key) => {
      const status: GapResult["status"] = entry.hasProcessing
        ? "processing"
        : entry.hasCompleted
          ? "completed"
          : "failed";

      map.set(key, {
        domain: entry.domain,
        status,
        gaps: Array.from(entry.gaps),
      });
    });

    return map;
  }, [gapResults]);

  const domainWiseGapResults = useMemo(
    () => Array.from(domainWiseGapMap.values()),
    [domainWiseGapMap],
  );

  const getDomainGapData = useCallback(
    (domainName: string) => domainWiseGapMap.get(normalizeDomainName(domainName)),
    [domainWiseGapMap],
  );

  if (!isHydrated || !domainWiseDomains.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const safeActiveDomainIdx = Math.min(activeDomainIdx, domainWiseDomains.length - 1);
  const activeDomain = domainWiseDomains[safeActiveDomainIdx];
  const activeNist = activeDomain.related_nist_policies?.length || 0;
  const totalNist = domainWiseDomains.reduce(
    (count, domain) => count + (domain.related_nist_policies?.length || 0),
    0,
  );

  const activeGapData = getDomainGapData(activeDomain.domain);

  const handleDownloadGapsPdf = () => {
    const content = domainWiseGapResults
      .map((result, index) => {
        const gapsText =
          result.gaps && result.gaps.length > 0
            ? result.gaps
                .map((gap, gapIndex) => `${gapIndex + 1}. ${gap}`)
                .join("\n")
            : "No gaps available";

        return `${index + 1}. Domain: ${result.domain}\n\n${gapsText}`;
      })
      .join("\n\n----------------------------------------\n\n");

    downloadTextAsPdf({
      title: "Gap Analysis",
      content,
      fileName: `gap-analysis`,
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f6fa]">
      <AppTopBar
        section="Analysis Results"
        actions={
          <>
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-bold transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" /> New Upload
            </button>

            <div className="w-px h-6 bg-slate-200" />

            <button
              onClick={handleDownloadGapsPdf}
              disabled={analyzing || domainWiseGapResults.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-all border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download Gaps
            </button>

            <button
              onClick={() => router.push("/revised-policy")}
              disabled={analyzing}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Revised Policy
            </button>

            <button
              onClick={() => router.push("/roadmap")}
              disabled={!hasRevisedPolicy}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Go to Roadmap
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          </>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <ResultsSidebar
          domains={domainWiseDomains}
          activeDomainIdx={safeActiveDomainIdx}
          onSelectDomain={setActiveDomainIdx}
          totalNist={totalNist}
          getDomainGapData={getDomainGapData}
        />

        <ResultsDomainDetails
          domain={activeDomain}
          activeDomainIdx={safeActiveDomainIdx}
          activeNist={activeNist}
          activeGapData={activeGapData}
        />
      </div>
    </div>
  );
}
