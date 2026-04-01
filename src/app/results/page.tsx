"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Layers,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  FileText,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

interface DomainEntry {
  domain: string;
  text: string | string[];
  related_nist_policies: string[];
}

interface GapResult {
  domain: string;
  status: "processing" | "completed" | "failed";
  gaps?: string[];
}

const GAP_CACHE_PREFIX = "gapResults:";

const getGapCacheKey = (fileId: string) => `${GAP_CACHE_PREFIX}${fileId}`;

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
  const [domains] = useState<DomainEntry[]>(() => getCachedDomains());
  const [activeDomainIdx, setActiveDomainIdx] = useState<number>(0);
  const [generatingPolicy, setGeneratingPolicy] = useState(false);
  const [gapResults, setGapResults] = useState<GapResult[]>([]);
  const [analyzing, setAnalyzing] = useState(true);
  const startedRef = useRef(false);

  async function startGapAnalysis(domainData: DomainEntry[], fileId: string) {
    try {
      setAnalyzing(true);
      const startRes = await axios.post(
        "http://127.0.0.1:5000/api/analyze-gaps",
        domainData,
      );

      const checkCompleted = (results: GapResult[]) =>
        results?.length > 0 &&
        results.every(
          (result: GapResult) =>
            result.status === "completed" || result.status === "failed",
        );

      const currentResults = Array.isArray(startRes.data)
        ? startRes.data
        : startRes.data?.results || [];
      setGapResults(currentResults);

      localStorage.setItem(
        getGapCacheKey(fileId),
        JSON.stringify({ results: currentResults }),
      );

      if (checkCompleted(currentResults)) {
        setAnalyzing(false);
        return;
      }

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await axios.get(
            "http://127.0.0.1:5000/api/analyze-gaps",
          );
          const results = Array.isArray(statusRes.data)
            ? statusRes.data
            : statusRes.data?.results || [];
          setGapResults(results);

          localStorage.setItem(
            getGapCacheKey(fileId),
            JSON.stringify({ results }),
          );

          if (checkCompleted(results)) {
            clearInterval(pollInterval);
            setAnalyzing(false);
          }
        } catch (e) {
          console.error("Polling error:", e);
          clearInterval(pollInterval);
          setAnalyzing(false);
        }
      }, 5000);
    } catch (e) {
      console.error(e);
      setAnalyzing(false);
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    if (!domains.length) {
      router.replace("/");
      return;
    }

    try {
      startedRef.current = true;

      const fileId = localStorage.getItem("fileId");
      if (!fileId) {
        router.replace("/");
        return;
      }

      const cacheStorageKey = getGapCacheKey(fileId);

      const cachedRaw = localStorage.getItem(cacheStorageKey);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw);
          const cachedResults = Array.isArray(cached?.results)
            ? (cached.results as GapResult[])
            : [];
          if (cachedResults.length > 0) {
            queueMicrotask(() => {
              setGapResults(cachedResults);
            });
            const isCompleted = cachedResults.every(
              (result) =>
                result.status === "completed" || result.status === "failed",
            );
            if (isCompleted) {
              queueMicrotask(() => {
                setAnalyzing(false);
              });
              return;
            }
          }
        } catch (cacheError) {
          console.error("Failed to parse cached gap analysis", cacheError);
        }
      }

      queueMicrotask(() => {
        void startGapAnalysis(domains, fileId);
      });
    } catch {
      router.replace("/");
    }
  }, [router, domains]);

  const handleGeneratePolicy = async () => {
    if (!domains[0]) return;
    setGeneratingPolicy(true);
    const extractedText = localStorage.getItem("extractedText");
    const gapsData = gapResults.reduce(
      (acc, g) => {
        acc[g.domain] = g.gaps || [];
        return acc;
      },
      {} as Record<string, string[]>,
    );
    try {
      await axios.post(
        "http://127.0.0.1:5000/api/revised-policy",
        { extractedText, gapsData },
      );
      setGeneratingPolicy(false);
      // Navigate or show success if needed
    } catch (e) {
      console.error(e);
      setGeneratingPolicy(false);
    }
  };

  if (!domains.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const activeDomain = domains[activeDomainIdx];
  const activeNist = activeDomain.related_nist_policies?.length || 0;

  const getDomainGapData = (domainName: string) =>
    gapResults.find((g) => g.domain === domainName);
  const activeGapData = getDomainGapData(activeDomain.domain);
  const activeGapsCount = activeGapData?.gaps?.length || 0;

  const totalNist = domains.reduce(
    (a, d) => a + (d.related_nist_policies?.length || 0),
    0,
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f5f6fa] font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* HEADER */}
      <header className="shrink-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-md shadow-blue-500/20">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-lg">
            Policy<span className="text-blue-600">Guard</span>
          </span>
          <span className="text-slate-300 mx-2">/</span>
          <span className="text-slate-500 font-semibold text-sm">
            Analysis Results
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-bold transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" /> New Upload
          </button>
          <div className="w-px h-6 bg-slate-200" />
          <button
            onClick={handleGeneratePolicy}
            disabled={generatingPolicy || analyzing}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 disabled:opacity-50"
          >
            {generatingPolicy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Generate Revised Policy"
            )}
            {!generatingPolicy && (
              <ChevronRight className="w-4 h-4 opacity-70" />
            )}
          </button>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR - DOMAINS & STATS */}
        <div className="w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="mb-6">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Global Summary
              </h2>
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                {domains.length} Domains
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-50/20 border border-blue-100/50 rounded-xl p-3 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
              <div className="flex items-center gap-1.5 mb-1.5 text-blue-500">
                <BookOpen className="w-3.5 h-3.5" />
                <p className="text-[10px] font-bold uppercase tracking-widest leading-none">
                  Total NIST Controls
                </p>
              </div>
              <p className="text-xl font-extrabold text-blue-700 leading-none">
                {totalNist}
              </p>
            </div>
          </div>

          <div className="p-4 px-6 pt-5">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Detected Categories
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
            {domains.map((d, i) => {
              const isActive = i === activeDomainIdx;
              const nistCount = d.related_nist_policies?.length || 0;
              const dGapData = getDomainGapData(d.domain);
              const gapCount = dGapData?.gaps?.length || 0;

              return (
                <button
                  key={i}
                  onClick={() => setActiveDomainIdx(i)}
                  className={`w-full text-left p-4 rounded-2xl transition-all border relative overflow-hidden group ${
                    isActive
                      ? "bg-blue-50/50 border-blue-200 shadow-sm"
                      : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Layers
                      className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600 transition-colors"}`}
                    />
                    <h3
                      className={`font-bold text-sm line-clamp-1 ${isActive ? "text-blue-900" : "text-slate-700"}`}
                    >
                      {d.domain}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span
                      className={isActive ? "text-blue-600" : "text-slate-500"}
                    >
                      {nistCount} controls
                    </span>
                    <span className="text-slate-300">•</span>
                    <span
                      className={isActive ? "text-blue-600" : "text-slate-500"}
                    >
                      {!dGapData || dGapData.status === "processing" ? (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Loader2 className="w-3 h-3 animate-spin" /> Analyzing
                          gaps
                        </span>
                      ) : dGapData.status === "completed" ? (
                        <span
                          className={
                            isActive ? "text-red-600" : "text-slate-500"
                          }
                        >
                          {gapCount} gaps
                        </span>
                      ) : (
                        <span className="text-slate-400">Failed</span>
                      )}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT CONTENT - DOMAIN DETAILS */}
        <div className="flex-1 relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-[#f8f9fc] p-8 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDomainIdx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto space-y-8 pb-32"
            >
              {/* Domain Header Info */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-start justify-between relative z-10 gap-8">
                  <div className="space-y-4 flex-1">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight leading-tight">
                      {activeDomain.domain}
                    </h1>
                    <p className="text-slate-500 font-medium max-w-xl text-base leading-relaxed">
                      This domain encapsulates policies related to{" "}
                      <strong className="text-slate-700">
                        {activeDomain.domain.toLowerCase()}
                      </strong>
                      . Review the associated standards mapped below.
                    </p>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 bg-[#f8f9fc] rounded-3xl p-5 border border-slate-100 shadow-inner shrink-0">
                    <div className="text-center px-4">
                      {!activeGapData ||
                      activeGapData.status === "processing" ? (
                        <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500 mb-2" />
                      ) : (
                        <p className="text-4xl font-black text-red-500">
                          {activeGapsCount}
                        </p>
                      )}
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Identified Gaps
                      </p>
                    </div>
                    <div className="w-px h-16 bg-slate-200" />
                    <div className="text-center px-4">
                      <p className="text-4xl font-black text-blue-600">
                        {activeNist}
                      </p>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">
                        NIST Controls
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Domain Gaps Map */}
              {activeGapData?.status === "completed" &&
                activeGapData.gaps &&
                activeGapData.gaps.length > 0 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                          Identified Gaps
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="group relative bg-white rounded-2xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-all duration-300"
                      >
                        {activeGapData.gaps.map((gap, j) => (
                          <div
                            className="flex items-start gap-4 relative z-10"
                            key={j}
                          >
                            <div className="w-2.5 h-2.5 mt-1.5 shrink-0 rounded-full bg-red-400" />
                            <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed font-medium">
                              {gap}
                            </p>
                          </div>
                        ))}
                      </motion.div>
                    </div>
                  </div>
                )}

              {/* NIST Policies Map */}
              {activeNist > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        Relevant NIST Controls
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5">
                    {activeDomain.related_nist_policies.map((p, j) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + j * 0.04 }}
                        key={j}
                        className="group relative bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all duration-300 overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start gap-5 relative z-10">
                          <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#f8f9fc] border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors duration-300">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 text-slate-500 text-[10px] font-black tracking-widest uppercase rounded-lg transition-colors">
                                CONTROL {String(j + 1).padStart(2, "0")}
                              </span>
                            </div>
                            <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                              {p}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-16 text-center border-2 border-slate-200 border-dashed mt-8">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <FileText className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    No Controls Found
                  </h3>
                  <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto">
                    The semantic analysis engine did not map any NIST standards
                    for the input chunks in this domain.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
