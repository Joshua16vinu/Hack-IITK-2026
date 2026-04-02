"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { nistDomainsData } from "@/data/nistPolicies";
import {
  BookOpen,
  Search,
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { getStyle } from "@/data/domainStyles";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NistPoliciesPage() {
  const [search, setSearch] = useState("");
  const [expandedDomain, setExpandedDomain] = useState<string | null>(
    nistDomainsData[0].name,
  );

  const totalPolicies = useMemo(
    () => nistDomainsData.reduce((a, d) => a + d.policies.length, 0),
    [],
  );

  const filteredDomains = useMemo(() => {
    if (!search.trim()) return nistDomainsData;
    const q = search.toLowerCase();
    return nistDomainsData
      .map((d) => ({
        ...d,
        policies: d.policies.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            d.name.toLowerCase().includes(q),
        ),
      }))
      .filter((d) => d.policies.length > 0);
  }, [search]);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <AppTopBar
        section="NIST Policy Library"
        actions={
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        }
      />

      <div className="max-w-5xl mx-auto px-6 pt-10 pb-20 space-y-8">
        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3B8FF3]/8 border border-[#3B8FF3]/20 text-[#3B8FF3] text-xs font-semibold mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            NIST SP 800-53 Reference Library
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            NIST Policies
          </h1>
          <p className="text-slate-500 text-base max-w-2xl">
            Standard policy directory and templates for compliance domains.
            Browse and download official CIS/NIST policy documents organized by
            security domain.
          </p>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#3B8FF3]/8">
              <Shield className="w-5 h-5 text-[#3B8FF3]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Security Domains
              </p>
              <p className="text-2xl font-extrabold text-[#3B8FF3] tabular-nums mt-0.5">
                {nistDomainsData.length}
              </p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#34B1AA]/8">
              <FileText className="w-5 h-5 text-[#34B1AA]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Policy Templates
              </p>
              <p className="text-2xl font-extrabold text-[#34B1AA] tabular-nums mt-0.5">
                {totalPolicies}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Search ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="relative"
        >
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search policies or domains…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B8FF3]/30 focus:border-[#3B8FF3]/50 shadow-sm transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>

        {/* ── Domain Accordion List ── */}
        {filteredDomains.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-slate-400"
          >
            <Search className="w-10 h-10 mx-auto mb-3 opacity-25" />
            <p className="font-medium text-slate-500">
              No policies found for &quot;{search}&quot;
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredDomains.map((domain, di) => {
              const style = getStyle(domain.name);
              const Icon = style.icon;
              const isOpen = expandedDomain === domain.name || !!search;

              return (
                <motion.div
                  key={domain.name}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: di * 0.07 }}
                  className={cn(
                    "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all",
                    style.border,
                  )}
                >
                  {/* Accordion header */}
                  <button
                    onClick={() =>
                      setExpandedDomain(isOpen && !search ? null : domain.name)
                    }
                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          "p-2.5 rounded-xl",
                          style.bg,
                          "border",
                          style.border,
                        )}
                      >
                        <Icon className={cn("w-5 h-5", style.color)} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-800 text-base leading-tight">
                          {domain.name}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {domain.policies.length} policy templates
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <span
                        className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-full border",
                          style.color,
                          style.bg,
                          style.border,
                        )}
                      >
                        {domain.policies.length}
                      </span>
                      {!search &&
                        (isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ))}
                    </div>
                  </button>

                  {/* Policy list */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {domain.policies.map((policy, pi) => (
                            <motion.a
                              key={policy.name}
                              href={policy.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: pi * 0.03 }}
                              className="group flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-[#3B8FF3]/30 hover:bg-[#3B8FF3]/3 bg-slate-50/50 transition-all"
                            >
                              <div
                                className={cn(
                                  "p-2 rounded-lg shrink-0 transition-colors",
                                  style.bg,
                                  "group-hover:bg-[#3B8FF3]/15",
                                )}
                              >
                                <FileText
                                  className={cn(
                                    "w-3.5 h-3.5 transition-colors",
                                    style.color,
                                    "group-hover:text-[#3B8FF3]",
                                  )}
                                />
                              </div>
                              <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 flex-1 leading-snug transition-colors">
                                {policy.name}
                              </span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#3B8FF3] transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
                            </motion.a>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Footer note ── */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            Policy templates sourced from{" "}
            <a
              href="https://www.cisecurity.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3B8FF3] hover:underline"
            >
              CIS Security
            </a>{" "}
            and aligned with NIST SP 800-53 Rev. 5.
          </p>
        </div>
      </div>
    </div>
  );
}
