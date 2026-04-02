"use client";

import { ShieldCheck, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      initial={{ width: 240 }}
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen bg-white border-r border-slate-200 flex flex-col z-50 sticky top-0 shadow-lg shadow-slate-200/50"
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 relative overflow-hidden group">
        <div className="w-8 h-8 rounded-lg bg-[#F29F67] flex items-center justify-center shrink-0 shadow-md">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <motion.div
          initial={{ opacity: 1, width: "auto" }}
          animate={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : "auto",
          }}
          className="ml-3 font-bold text-slate-900 tracking-tight overflow-hidden whitespace-nowrap"
        >
          Policy<span className="text-[#F29F67]">Guard</span>
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        {/* Items removed via user request */}
      </div>

      <div className="px-3 pb-4 mt-2">
        <Link
          href="/nist-policies"
          className={cn(
            "w-full flex items-center px-3 py-2.5 rounded-xl transition-all group relative duration-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900",
          )}
        >
          <BookOpen className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" />
          <motion.span
            animate={{
              opacity: collapsed ? 0 : 1,
              width: collapsed ? 0 : "auto",
            }}
            className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
          >
            NIST Policies
          </motion.span>
        </Link>
      </div>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          suppressHydrationWarning
          className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 transition-colors text-xs uppercase tracking-wider font-bold"
        >
          {collapsed ? "Exp" : "Collapse View"}
        </button>
      </div>
    </motion.div>
  );
}
