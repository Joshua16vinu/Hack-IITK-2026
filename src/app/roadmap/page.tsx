"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Map,
  Compass,
} from "lucide-react";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { PageContainer } from "@/components/layout/PageContainer";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { GeneratorPanel } from "@/components/ui/GeneratorPanel";

export default function RoadmapPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  const [hasData, setHasData] = useState(false);
  const autoStartRef = useRef(false);
  const [inputPolicy, setInputPolicy] = useState("");
  const [revisedPolicy, setRevisedPolicy] = useState("");

  const contentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentEndRef.current && streamedText) {
      contentEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamedText]);

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
        "Required data (original policy or revised policy) is missing. Please make sure you have generated the revised policy first.",
      );
      return;
    }

    setInputPolicy(originalText);
    setRevisedPolicy(revisedText);
    setHasData(true);
  }, []);

  const handleGenerateRoadmap = useCallback(async () => {
    if (!hasData) return;

    setLoading(true);
    setStreamedText("");
    setErrorText(null);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/get-roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_policy: inputPolicy,
          revised_policy: revisedPolicy,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error(
          "ReadableStream not supported by browser or empty response",
        );
      }

      const reader = response.body.getReader();
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

      const fileId = localStorage.getItem("fileId");
      if (fileId) {
        localStorage.setItem(`roadmap:${fileId}`, fullText);
      }
    } catch (err: unknown) {
      console.error("Streaming error:", err);
      setErrorText(
        err instanceof Error
          ? err.message
          : "An error occurred while generating the roadmap.",
      );
    } finally {
      setLoading(false);
    }
  }, [hasData, inputPolicy, revisedPolicy]);

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

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f6fa] font-sans selection:bg-blue-100 selection:text-blue-900">
      <AppTopBar
        section="Roadmap Planner"
        actions={
          <button
            onClick={() => router.push("/revised-policy")}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-bold transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Revised Policy
          </button>
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
              !hasData ? (
                <button
                  onClick={() => router.push("/revised-policy")}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors"
                >
                  Go back
                </button>
              ) : null
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
            <button
              onClick={handleGenerateRoadmap}
              disabled={loading || !hasData}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed group w-full sm:w-auto justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Planning...</span>
                </>
              ) : (
                <>
                  <Map className="w-4 h-4 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                  <span>Regenerate Roadmap</span>
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
                  Ready to plan your execution.
                </p>
                <p className="text-sm max-w-sm mt-2 font-medium">
                  Click &quot;Regenerate Roadmap&quot; to outline the
                  implementation steps.
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
