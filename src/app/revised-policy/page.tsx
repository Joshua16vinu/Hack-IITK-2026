"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  ChevronRight,
  Download,
  FileText,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { useToast } from "@/components/ui/Toast";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GeneratorPanel } from "@/components/ui/GeneratorPanel";
import { downloadTextAsPdf } from "@/lib/pdf";
import { generateRevisedPolicy } from "@/services/api";
import type { GapCacheResult } from "@/types";

export default function RevisedPolicyPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  const { setToast } = useToast();

  const [hasData, setHasData] = useState(false);
  const autoStartRef = useRef(false);
  const [extractedText, setExtractedText] = useState("");
  const [combinedGaps, setCombinedGaps] = useState("");

  const contentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentEndRef.current && streamedText) {
      contentEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamedText]);

  useEffect(() => {
    const fileId = localStorage.getItem("fileId");
    const gapCacheKey = `gapAnalysis:${fileId}`;
    const text = localStorage.getItem("extractedText");
    const gapsRaw = localStorage.getItem(gapCacheKey);

    const cachedPolicy = localStorage.getItem(`revisedPolicy:${fileId}`);
    if (cachedPolicy) {
      setStreamedText(cachedPolicy);
    }
    if (!text || !gapsRaw) {
      setErrorText(
        "Required data (extracted text or gap analysis) is missing from localStorage. Please upload a policy first.",
      );
      return;
    }

    setExtractedText(text);

    try {
      const parsedGaps = JSON.parse(gapsRaw);
      let results: GapCacheResult[] = [];

      if (
        parsedGaps &&
        parsedGaps.results &&
        Array.isArray(parsedGaps.results)
      ) {
        results = parsedGaps.results;
      } else if (Array.isArray(parsedGaps)) {
        results = parsedGaps;
      } else {
        throw new Error("Invalid gap analysis format");
      }

      const combined = results
        .map((result) => {
          const domainStr = `Domain: ${result.domain}`;
          const gapsStr = (result.gaps || [])
            .map((g: string) => `* ${g}`)
            .join("\n");
          return `${domainStr}\n${gapsStr}`;
        })
        .join("\n\n");

      setCombinedGaps(combined);
      setHasData(true);
    } catch (err) {
      console.error("Error parsing gap analysis:", err);
      setErrorText(
        "Failed to parse gap analysis data from localStorage. The format might be invalid.",
      );
    }
  }, []);

  const handleGeneratePolicy = useCallback(async () => {
    if (!hasData) return;

    setLoading(true);
    setStreamedText("");
    setErrorText(null);

    try {
      const response = await generateRevisedPolicy({
        text: extractedText,
        gapAnalysis: combinedGaps,
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
        title: "Policy Generated",
        message: "The revised policy has been successfully generated.",
        variant: "success",
      });

      const fileId = localStorage.getItem("fileId");
      if (fileId) {
        localStorage.setItem(`revisedPolicy:${fileId}`, fullText);
      }
    } catch {
      console.error("Streaming error:");
      setErrorText("An error occurred while generating the revised policy.");
      setToast({
        title: "Policy Generation Failed",
        message: "An error occurred while generating the revised policy.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [combinedGaps, extractedText, hasData, setToast]);

  useEffect(() => {
    if (hasData && !autoStartRef.current) {
      const fileId = localStorage.getItem("fileId");
      const cachedPolicy = localStorage.getItem(`revisedPolicy:${fileId}`);
      if (!cachedPolicy) {
        autoStartRef.current = true;
        handleGeneratePolicy();
      }
    }
  }, [handleGeneratePolicy, hasData]);

  const handleDownloadRevisedPolicyPdf = () => {
    downloadTextAsPdf({
      title: "Revised Policy",
      content: streamedText,
      fileName: `revised-policy`,
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f6fa]">
      <AppTopBar
        section="Revised Policy"
        actions={
          <>
            <button
              onClick={() => router.push("/analysis")}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-bold transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Analysis
            </button>
            <div className="w-px h-6 bg-slate-200 hidden sm:block" />
            <button
              onClick={handleDownloadRevisedPolicyPdf}
              disabled={!streamedText || loading}
              className="flex items-center gap-2 px-6 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-all border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Download Policy
            </button>
            <button
              onClick={() => router.push("/roadmap")}
              disabled={!streamedText || loading}
              className={`flex items-center gap-2 px-6 py-2 text-white text-sm font-bold rounded-lg transition-all shadow-lg ${
                !streamedText || loading
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-700 opacity-50 cursor-not-allowed shadow-emerald-600/25"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 shadow-emerald-600/25 hover:shadow-emerald-600/40"
              }`}
            >
              Go to Roadmap
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          </>
        }
      />

      <PageContainer>
        <div className="w-full text-center space-y-4 mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight leading-tight">
            Generate Revised Policy
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto text-base leading-relaxed">
            We will restructure and rewrite your policy document to satisfy all
            identified NIST controls and close the existing domain gaps.
          </p>
        </div>

        {errorText && (
          <ErrorBanner
            message={errorText}
            action={
              !hasData && (
                <button
                  onClick={() => router.push("/")}
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
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Revised Policy
                </h2>
              </div>
            </div>
          }
          action={
            <button
              onClick={handleGeneratePolicy}
              disabled={loading || !hasData}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed group w-full sm:w-auto justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 text-slate-300 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Regenerate Policy</span>
                </>
              )}
            </button>
          }
        >
          <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-6 overflow-y-auto font-mono text-sm leading-relaxed text-slate-700 shadow-inner scrollbar-thin scrollbar-thumb-slate-300 relative whitespace-pre-wrap">
            {!streamedText && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400/60 p-8 text-center">
                <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
                <p className="font-semibold text-lg text-slate-400">
                  Ready to draft your new policy.
                </p>
                <p className="text-sm max-w-sm mt-2 font-medium">
                  Click &quot;Regenerate Policy&quot; to begin streaming
                  real-time AI revisions.
                </p>
              </div>
            )}

            {!streamedText && loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-50/80 backdrop-blur-sm z-10 transition-all duration-500">
                <div className="relative mb-6">
                  <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-20 duration-1000" />
                  <div className="relative bg-white shadow-xl shadow-blue-900/5 rounded-full p-5 border border-blue-100">
                    <Sparkles className="w-10 h-10 text-blue-500 animate-pulse" />
                  </div>
                </div>
                <h3 className="font-extrabold text-xl text-slate-800 tracking-tight mb-2">
                  AI is conceptualizing...
                </h3>
                <p className="text-sm font-medium text-slate-500 max-w-xs leading-relaxed">
                  Synthesizing domain controls and filling existing gaps to
                  draft a comprehensive revised policy.
                </p>
                <div className="flex items-center gap-1.5 mt-6">
                  <div
                    className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
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
