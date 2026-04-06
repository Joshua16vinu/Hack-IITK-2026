"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { HomeHeroPanel } from "@/components/features/home/HomeHeroPanel";
import { HomeUploadPanel } from "@/components/features/home/HomeUploadPanel";
import type { UploadResult } from "@/types";

export default function EnterpriseDashboard() {
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

  const handleUploadSuccess = (data: UploadResult) => {
    localStorage.setItem("uploadedDomains", JSON.stringify(data.result));
    localStorage.setItem("extractedText", data.extracted_text);
    localStorage.setItem("fileId", data.file_id);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8f9fc]">
      <AppTopBar />

      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex justify-center min-h-full p-6 lg:p-12 relative"
          >
            <div className="absolute top-0 right-0 w-[800px] bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] bg-orange-50/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div className="w-full max-w-[1400px] grid grid-cols-1 xl:grid-cols-2 gap-16 items-center flex-1 relative z-10 mt-8 xl:mt-0">
              <HomeHeroPanel />
              <HomeUploadPanel onSuccess={handleUploadSuccess} />
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
