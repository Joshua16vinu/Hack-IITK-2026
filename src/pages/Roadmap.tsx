"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  ArrowLeft,
  Download,
  ShieldCheck,
  Map,
  Compass,
} from "lucide-react";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/components/ui/Toast";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GeneratorPanel } from "@/components/ui/GeneratorPanel";
import { downloadTextAsPdf, downloadConsolidatedPdf } from "@/lib/pdf";
import { generateRoadmap } from "@/services/api";

export default function RoadmapPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const { setToast } = useToast();
  const [hasData, setHasData] = useState(false);
  const autoStartRef = useRef(false);
  const [inputPolicy, setInputPolicy] = useState("");
  const [revisedPolicy, setRevisedPolicy] = useState("");
  const [gapContent, setGapContent] = useState("");

  const contentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentEndRef.current && streamedText && loading) {
      contentEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading, streamedText]);

  useEffect(() => {
    const fileId = localStorage.getItem("fileId");
    const originalText = localStorage.getItem("extractedText");
    const revisedText = localStorage.getItem(`revisedPolicy:${fileId}`);

    const cachedRoadmap = localStorage.getItem(`roadmap:${fileId}`);
    if (cachedRoadmap) {
      setStreamedText(cachedRoadmap);
    }

    if (!originalText || !revisedText) {
      setErrorText(
        "Required data could not be found. Please start by uploading a policy."
      );
      return;
    }

    setInputPolicy(originalText);
    setRevisedPolicy(revisedText);

    // Build gap content string from cached gap analysis
    const gapCacheRaw = fileId ? localStorage.getItem(`gapAnalysis:${fileId}`) : null;
    if (gapCacheRaw) {
      try {
        const parsed = JSON.parse(gapCacheRaw);
        const results = Array.isArray(parsed?.results) ? parsed.results : [];
        const combined = results
          .map((r: { domain: string; gaps?: string[] }, i: number) => {
            const gapsText =
              r.gaps && r.gaps.length > 0
                ? r.gaps.map((g, gi) => `${gi + 1}. ${g}`).join("\n")
                : "No gaps identified";
            return `${i + 1}. Domain: ${r.domain}\n\n${gapsText}`;
          })
          .join("\n\n----------------------------------------\n\n");
        setGapContent(combined);
      } catch {
        // ignore parse errors — consolidated PDF will skip gap section
      }
    }

    setHasData(true);
  }, []);

  const handleGenerateRoadmap = useCallback(async () => {
    if (!hasData) return;

    setLoading(true);
    setStreamedText("");
    setErrorText(null);

    try {
      const response = await generateRoadmap({
        inputPolicy,
        gaps: gapContent,
      });

      const body = response.body;
      if (!body) {
        throw new Error(
          "ReadableStream not supported by browser or empty response",
        );
      }

      const reader = body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          setStreamedText((prev) => prev + chunk);
          fullText += chunk;
        }
      }

      setToast({
        title: "Roadmap Generated",
        message: "The implementation roadmap has been successfully generated.",
        variant: "success",
      });

      const fileId = localStorage.getItem("fileId");
      if (fileId) {
        localStorage.setItem(`roadmap:${fileId}`, fullText);
      }
    } catch {
      console.error("Streaming error:");
      setErrorText("An error occurred while generating the roadmap.");
      setToast({
        title: "Roadmap Generation Failed",
        message: "An error occurred while generating the roadmap.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [hasData, inputPolicy, setToast, gapContent]);

  useEffect(() => {
    if (hasData && !autoStartRef.current) {
      const fileId = localStorage.getItem("fileId");
      const cachedRoadmap = localStorage.getItem(`roadmap:${fileId}`);
      if (!cachedRoadmap) {
        autoStartRef.current = true;
        handleGenerateRoadmap();
      }
    }
  }, [handleGenerateRoadmap, hasData]);

  const handleDownloadRoadmapPdf = () => {
    downloadTextAsPdf({
      title: "Implementation Roadmap",
      content: streamedText,
      fileName: `implementation-roadmap`,
    });
  };

  const handleDownloadConsolidatedPdf = () => {
    downloadConsolidatedPdf({
      gapContent,
      revisedPolicyContent: revisedPolicy,
      roadmapContent: streamedText,
      fileName: "consolidated-compliance-report",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f6fa]">
      <AppTopBar
        section="Roadmap Planner"
        actions={
          <>
            <button
              onClick={() => navigate("/revised-policy")}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-bold transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Revised Policy
            </button>
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <button
              onClick={handleDownloadRoadmapPdf}
              disabled={!streamedText || loading}
              className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-all border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download Roadmap
            </button>
            <button
              onClick={handleDownloadConsolidatedPdf}
              disabled={!streamedText || loading}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold rounded-lg transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download Full Report
            </button>
          </>
        }
      />

      <PageContainer>
        <div className="w-full text-center space-y-4 mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight leading-tight">
            Implementation Roadmap
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto text-base leading-relaxed">
            Our AI engine will analyze the differences between your original and
            newly revised policy, mapping out a clear roadmap to enforce the new
            standards.
          </p>
        </div>

        {errorText && (
          <ErrorBanner
            message={errorText}
            action={
              !hasData && (
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors"
                >
                  Go to Upload
                </button>
              )
            }
          />
        )}

        <GeneratorPanel
          header={
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                <Map className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Strategic Roadmap
                </h2>
                <p className="text-sm text-slate-400 font-medium tracking-wide">
                  AI-Generated Step-by-Step Guide
                </p>
              </div>
            </div>
          }
          action={
            loading ? (
              <button
                disabled
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed group w-full sm:w-auto justify-center"
              >
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>Planning...</span>
              </button>
            ) : null
          }
        >
          <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-6 overflow-y-auto font-mono text-sm leading-relaxed text-slate-700 shadow-inner scrollbar-thin scrollbar-thumb-slate-300 relative whitespace-pre-wrap">
            {!streamedText && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400/60 p-8 text-center">
                <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-semibold text-lg text-slate-400">
                  Ready to plan your execution.
                </p>
                <p className="text-sm max-w-sm mt-2 font-medium">
                  Roadmap generation starts automatically when this page
                  loads. Reload page if it does not start within a few seconds.
                </p>
              </div>
            )}

            {!streamedText && loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-50/80 backdrop-blur-sm z-10 transition-all duration-500">
                <div className="relative mb-6">
                  <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400 opacity-20 duration-1000" />
                  <div className="relative bg-white shadow-xl shadow-indigo-900/5 rounded-full p-5 border border-indigo-100">
                    <Compass className="w-10 h-10 text-indigo-500 animate-[spin_3s_linear_infinite]" />
                  </div>
                </div>
                <h3 className="font-extrabold text-xl text-slate-800 tracking-tight mb-2">
                  Plotting Strategic Roadmap...
                </h3>
                <p className="text-sm font-medium text-slate-500 max-w-xs leading-relaxed">
                  Analyzing the revised policy against your original boundaries
                  to orchestrate a step-by-step rollout plan.
                </p>
                <div className="flex items-center gap-1.5 mt-6">
                  <div
                    className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}

            {streamedText}

            {loading && (
              <span className="inline-block w-2.5 h-4 ml-1 bg-blue-500 animate-pulse align-middle" />
            )}
            <div ref={contentEndRef} />
          </div>
        </GeneratorPanel>
      </PageContainer>
    </div>
  );
}
