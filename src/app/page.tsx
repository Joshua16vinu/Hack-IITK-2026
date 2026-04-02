"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { PolicySelector } from "@/components/layout/PolicySelector";
import { HomeHeroPanel } from "@/components/features/home/HomeHeroPanel";
import { HomeUploadPanel } from "@/components/features/home/HomeUploadPanel";
import {
  PolicyDetailsModal,
  Policy,
} from "@/components/features/analysis/PolicyDetailsModal";

export default function EnterpriseDashboard() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

  useEffect(() => {
    const cached = localStorage.getItem("uploadedDomains");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const domains = Array.isArray(parsed) ? parsed : (parsed?.result ?? []);
        localStorage.setItem("uploadedDomains", JSON.stringify(domains));
      } catch (e) {
        console.error("Failed to parse cached domains", e);
      }
    }
  }, []);

  const handleUploadSuccess = (data: unknown) => {
    const uploadData = data as {
      result?: unknown[];
      extracted_text?: string;
      file_id?: string;
    };
    const domains = Array.isArray(data) ? data : (uploadData?.result ?? []);
    localStorage.setItem("uploadedDomains", JSON.stringify(domains));
    if (uploadData?.extracted_text) {
      localStorage.setItem("extractedText", uploadData.extracted_text);
    }
    if (uploadData?.file_id) {
      localStorage.setItem("fileId", uploadData.file_id);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden selection:bg-blue-100 selection:text-blue-900 font-sans bg-[#f8f9fc]">
      <AppTopBar
        actions={
          <>
            <PolicySelector onSelect={setSelectedPolicy} />
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <button
              className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all group"
              suppressHydrationWarning
            >
              <Bell className="w-5 h-5 group-hover:text-[#F29F67] transition-colors" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F29F67] to-[#3B8FF3] flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-md hover:shadow-lg hover:scale-105 transition-all">
              JD
            </div>
          </>
        }
      />

      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex justify-center min-h-full p-6 lg:p-12 relative"
          >
            {/* Background Ambient Decoratives (Fixed overflow) */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-50/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div className="w-full max-w-[1400px] grid grid-cols-1 xl:grid-cols-2 gap-16 items-center flex-1 relative z-10 mt-8 xl:mt-0">
              <HomeHeroPanel />
              <HomeUploadPanel onSuccess={handleUploadSuccess} />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Restore Policy Details Modal which was connected to the Header Search */}
      <PolicyDetailsModal
        policy={selectedPolicy}
        onClose={() => setSelectedPolicy(null)}
      />
    </div>
  );
}
