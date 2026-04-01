"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, FileText, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export default function RevisedPolicyPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);
  
  const [hasData, setHasData] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [combinedGaps, setCombinedGaps] = useState("");

  const contentEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentEndRef.current && streamedText) {
       contentEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamedText]);

  useEffect(() => {
    const text = localStorage.getItem("extracted_text") || localStorage.getItem("extractedText");
    const gapsRaw = localStorage.getItem("gap_analysis") || localStorage.getItem("analysisResult");
    
    if (!text || !gapsRaw) {
      setErrorText("Required data (extracted text or gap analysis) is missing from localStorage. Please upload a policy first.");
      return;
    }
    
    setExtractedText(text);
    
    try {
      const parsedGaps = JSON.parse(gapsRaw);
      let results = [];
      
      if (parsedGaps && parsedGaps.results && Array.isArray(parsedGaps.results)) {
        results = parsedGaps.results;
      } else if (Array.isArray(parsedGaps)) {
        results = parsedGaps;
      } else {
        throw new Error("Invalid gap analysis format");
      }
      
      const combined = results.map((result: any) => {
        const domainStr = `Domain: ${result.domain}`;
        const gapsStr = (result.gaps || []).map((g: string) => `* ${g}`).join('\n');
        return `${domainStr}\n${gapsStr}`;
      }).join('\n\n');
      
      setCombinedGaps(combined);
      setHasData(true);
    } catch (err) {
      console.error("Error parsing gap analysis:", err);
      setErrorText("Failed to parse gap analysis data from localStorage. The format might be invalid.");
    }
  }, []);

  const handleGeneratePolicy = async () => {
    if (!hasData) return;
    
    setLoading(true);
    setStreamedText("");
    setErrorText(null);
    
    try {
      const response = await fetch("http://127.0.0.1:5000/api/revised-policy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: extractedText,
          gap_analysis: combinedGaps,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported by browser or empty response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          setStreamedText((prev) => prev + chunk);
        }
      }
    } catch (err: any) {
      console.error("Streaming error:", err);
      setErrorText(err.message || "An error occurred while generating the revised policy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f5f6fa] font-sans selection:bg-blue-100 selection:text-blue-900">
      <header className="shrink-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm z-50 px-6 flex items-center justify-between sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-md shadow-blue-500/20">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-slate-900 tracking-tight text-lg">
            Policy<span className="text-blue-600">Guard</span>
          </span>
          <span className="text-slate-300 mx-2">/</span>
          <span className="text-slate-500 font-semibold text-sm">
            Revised Policy Editor
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/results")}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-bold transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Analysis
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 flex flex-col">
        <div className="w-full text-center space-y-4 mb-8">
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight leading-tight">
            Generate Revised Policy
          </h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto text-base leading-relaxed">
            Our AI engine will restructure and rewrite your policy document to satisfy all identified NIST controls and close the existing domain gaps.
          </p>
        </div>

        {errorText && (
          <div className="w-full bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-start gap-4 shadow-sm">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold mb-1">Error</h3>
              <p className="text-sm font-medium opacity-90">{errorText}</p>
            </div>
            {!hasData && (
              <button 
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 transition-colors"
                >
                Go to Upload
              </button>
            )}
          </div>
        )}

        <div className="flex-1 w-full bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col min-h-[600px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-6 border-b border-slate-100 gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Revised Output</h2>
                <p className="text-sm text-slate-400 font-medium tracking-wide">AI-Generated Policy Stream</p>
              </div>
            </div>

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
                  <span>Generate Revised Policy</span>
                </>
              )}
            </button>
          </div>

          <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-6 overflow-y-auto font-mono text-sm leading-relaxed text-slate-700 shadow-inner scrollbar-thin scrollbar-thumb-slate-300 relative whitespace-pre-wrap">
            {!streamedText && !loading && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400/60 p-8 text-center">
                 <ShieldCheck className="w-16 h-16 mb-4 opacity-50" />
                 <p className="font-semibold text-lg text-slate-400">Ready to draft your new policy.</p>
                 <p className="text-sm max-w-sm mt-2 font-medium">Click "Generate Revised Policy" to begin streaming real-time AI revisions.</p>
               </div>
            )}
            
            {streamedText}
            
            {loading && (
              <span className="inline-block w-2.5 h-4 ml-1 bg-blue-500 animate-pulse align-middle" />
            )}
            <div ref={contentEndRef} />
          </div>
        </div>
      </main>
    </div>
  );
}
