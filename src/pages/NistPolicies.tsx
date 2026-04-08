"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { nistDomainsData } from "@/data/nistPolicies";
import {
  BookOpen,
  Search,
  ExternalLink,
  FileText,
  X,
  ArrowLeft,
  Shield,
  Eye,
  Bell,
  RefreshCw,
  RotateCcw,
  Layers,
  Target,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { AppTopBar } from "@/components/layout/AppTopBar";
import { getStyle } from "@/data/domainStyles";

// ─── NIST CSF Functions ───────────────────────────────────────────────────────

const nistFunctions = [
  {
    id: "GV",
    name: "Govern",
    description:
      "Establish and monitor the organization's cybersecurity risk management strategy, expectations, and policy.",
    color: "#7C3AED",
    bg: "#7C3AED",
    icon: Layers,
  },
  {
    id: "ID",
    name: "Identify",
    description:
      "Understand the organization's assets, suppliers, and related cybersecurity risks.",
    color: "#3B8FF3",
    bg: "#3B8FF3",
    icon: Target,
  },
  {
    id: "PR",
    name: "Protect",
    description:
      "Implement safeguards to manage cybersecurity risks and ensure delivery of critical services.",
    color: "#34B1AA",
    bg: "#34B1AA",
    icon: Lock,
  },
  {
    id: "DE",
    name: "Detect",
    description:
      "Find and analyze possible cybersecurity attacks and compromises.",
    color: "#F59E0B",
    bg: "#F59E0B",
    icon: Eye,
  },
  {
    id: "RS",
    name: "Respond",
    description:
      "Take action regarding a detected cybersecurity incident.",
    color: "#EF4444",
    bg: "#EF4444",
    icon: Bell,
  },
  {
    id: "RC",
    name: "Recover",
    description:
      "Restore assets and operations that were impacted by a cybersecurity incident.",
    color: "#10B981",
    bg: "#10B981",
    icon: RotateCcw,
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NistPoliciesPage() {
  const [search, setSearch] = useState("");

  const allPolicies = useMemo(
    () =>
      nistDomainsData.flatMap((d) =>
        d.policies.map((p) => ({ ...p, domain: d.name })),
      ),
    [],
  );

  const filteredPolicies = useMemo(() => {
    if (!search.trim()) return allPolicies;
    const q = search.toLowerCase();
    return allPolicies.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q),
    );
  }, [search, allPolicies]);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <AppTopBar
        section="NIST Policy Library"
        actions={
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
        }
      />

      <div className="max-w-5xl mx-auto px-6 pt-10 pb-20 space-y-10">
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
            Explore all 6 Core Functions and 4 Security Domains — search, browse, and download official policy templates aligned with NIST SP 800-53.
          </p>
        </motion.div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="grid grid-cols-3 gap-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="p-2.5 rounded-xl bg-[#7C3AED]/8">
              <Lock className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                NIST CSF Functions
              </p>
              <p className="text-2xl font-extrabold text-[#7C3AED] tabular-nums mt-0.5">
                {nistFunctions.length}
              </p>
            </div>
          </div>
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
                {allPolicies.length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── NIST CSF Functions ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Core Functions
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {nistFunctions.map((fn, i) => {
              const Icon = fn.icon;
              return (
                <motion.div
                  key={fn.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div
                      className="p-1.5 rounded-lg"
                      style={{ backgroundColor: `${fn.bg}18` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: fn.color }} />
                    </div>
                    <span
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: fn.color }}
                    >
                      {fn.id}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-1">
                    {fn.name}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {fn.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── NIST Domains ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Security Domains
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {nistDomainsData.map((domain, i) => {
              const style = getStyle(domain.name);
              const Icon = style.icon;
              return (
                <motion.div
                  key={domain.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22 + i * 0.06 }}
                  className={cn(
                    "bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow",
                    style.border,
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        "p-2 rounded-xl",
                        style.bg,
                        "border",
                        style.border,
                      )}
                    >
                      <Icon className={cn("w-4 h-4", style.color)} />
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight">
                      {domain.name}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Search ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              Policy Templates
            </h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search policies…"
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
          </div>

          {/* ── Policy grid ── */}
          {filteredPolicies.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-slate-400"
            >
              <Search className="w-10 h-10 mx-auto mb-3 opacity-25" />
              <p className="font-medium text-slate-500">
                No policies found for &quot;{search}&quot;
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredPolicies.map((policy, pi) => (
                <motion.a
                  key={`${policy.domain}-${policy.name}`}
                  href={policy.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: pi * 0.02 }}
                  className="group flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 hover:border-[#3B8FF3]/30 hover:bg-[#3B8FF3]/3 bg-white shadow-sm transition-all"
                >
                  <div className="p-2 rounded-lg shrink-0 bg-slate-50 group-hover:bg-[#3B8FF3]/10 transition-colors">
                    <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#3B8FF3] transition-colors" />
                  </div>
                  <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 flex-1 leading-snug transition-colors">
                    {policy.name}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#3B8FF3] transition-colors shrink-0 opacity-0 group-hover:opacity-100" />
                </motion.a>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Footer note ── */}
        <div className="text-center pt-4 space-y-1.5">
          <p className="text-xs text-slate-400">
            Policies sourced from{" "}
            <a
              href="https://www.cisecurity.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3B8FF3] hover:underline"
            >
              CIS Security
            </a>{" "}
            and aligned with NIST SP 800-53.
          </p>
          <p className="text-xs text-slate-400">
            <a
              href="https://www.cisecurity.org/-/media/project/cisecurity/cisecurity/data/media/files/uploads/2024/08/cisms-isac-nist-cybersecurity-framework-policy-template-guide-2024.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#3B8FF3] hover:underline"
            >
              <FileText className="w-3 h-3" />
              Download the CIS NIST CSF Policy Template Guide (2024 PDF)
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
