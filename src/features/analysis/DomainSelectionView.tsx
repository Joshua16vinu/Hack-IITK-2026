"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  Layers,
  FileText,
  BookOpen,
  BarChart2,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMeta } from "@/data/domainStyles";
import { LucideIcon } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Domain {
  domain: string;
  text: string | string[];
  related_nist_policies: string[];
}

interface DomainSelectionProps {
  domains: Domain[];
  onSelect: (domain: Domain) => void; // kept for compatibility
  onSelectAll?: (domains: Domain[]) => void;
  onBack?: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const chunkCount = (text: string | string[]) =>
  Array.isArray(text) ? text.length : 1;
const totalChunks = (domains: Domain[]) =>
  domains.reduce((a, d) => a + chunkCount(d.text), 0);
const totalNist = (domains: Domain[]) =>
  domains.reduce((a, d) => a + (d.related_nist_policies?.length ?? 0), 0);

// ─── Main Component ──────────────────────────────────────────────────────────

export function DomainSelectionView({
  domains,
  onSelect,
  onSelectAll,
  onBack,
}: DomainSelectionProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "nist">("overview");

  const handleGenerate = () => {
    if (onSelectAll) {
      onSelectAll(domains);
    } else if (domains.length > 0) {
      // Fallback: trigger first domain for compatibility
      onSelect(domains[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-36 space-y-8">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 pt-4"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3B8FF3]/10 border border-[#3B8FF3]/20 text-[#3B8FF3] text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Analysis Summary
        </div>
        <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
          We identified{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F29F67] to-[#3B8FF3]">
            {domains.length} security domain{domains.length !== 1 ? "s" : ""}
          </span>{" "}
          in your document
        </h1>
        <p className="text-slate-400 text-base max-w-2xl mx-auto">
          Review the detected domains and their associated NIST controls. When
          ready, generate a complete gap analysis report.
        </p>
      </motion.div>

      {/* ── Summary Stats Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        <StatPill
          icon={Layers}
          label="Domains Detected"
          value={domains.length}
          color="text-[#3B8FF3]"
          bg="bg-[#3B8FF3]/10"
        />
        <StatPill
          icon={FileText}
          label="Total Input Chunks"
          value={totalChunks(domains)}
          color="text-[#F29F67]"
          bg="bg-[#F29F67]/10"
        />
        <StatPill
          icon={BookOpen}
          label="NIST Controls Retrieved"
          value={totalNist(domains)}
          color="text-[#34B1AA]"
          bg="bg-[#34B1AA]/10"
        />
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-1 bg-[#0f0f1c] border border-white/6 rounded-xl p-1 w-fit"
      >
        {[
          { key: "overview", label: "Overview", icon: BarChart2 },
          { key: "nist", label: "NIST Policies", icon: BookOpen },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as "overview" | "nist")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === key
                ? "bg-[#1e1e35] text-white shadow-sm border border-white/8"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </motion.div>

      {/* ── Tab Content ── */}
      <AnimatePresence mode="wait">
        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {domains.map((domain, i) => (
              <DomainCard key={i} domain={domain} index={i} />
            ))}
          </motion.div>
        )}

        {/* NIST POLICIES */}
        {activeTab === "nist" && (
          <motion.div
            key="nist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-4"
          >
            {domains.map((domain, i) => (
              <NistRow key={i} domain={domain} index={i} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed Bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="pointer-events-auto max-w-5xl mx-auto px-6 pb-6">
          <div className="bg-[#0d0d1e]/90 backdrop-blur-xl border border-white/8 rounded-2xl px-6 py-4 flex items-center justify-between gap-6 shadow-2xl shadow-black/60">
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm">
                Ready to generate gap analysis?
              </p>
              <p className="text-slate-500 text-xs mt-0.5 truncate">
                {domains.length} domain{domains.length !== 1 ? "s" : ""} ·{" "}
                {totalChunks(domains)} chunks · {totalNist(domains)} NIST
                controls
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-400 hover:text-white border border-white/8 hover:border-white/15 rounded-xl transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                New Upload
              </button>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-[#F29F67] to-[#e8874a] hover:from-[#f5aa77] hover:to-[#F29F67] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#F29F67]/20 transition-all hover:scale-105 hover:shadow-[#F29F67]/30"
                title="Analyze all detected domains together"
              >
                <Sparkles className="w-4 h-4" />
                Generate Gap Analysis for All Domains
                <ChevronRight className="w-4 h-4 opacity-70" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Domain Card (Overview Tab) ──────────────────────────────────────────────

function DomainCard({ domain, index }: { domain: Domain; index: number }) {
  const meta = getMeta(domain.domain);
  const Icon = meta.icon;
  const chunks = chunkCount(domain.text);
  const nistCount = domain.related_nist_policies?.length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-[#0f0f1c] p-6 transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-2xl",
        meta.border,
      )}
    >
      {/* Subtle glow overlay */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
          meta.bg,
        )}
        style={{ opacity: 0 }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
      />
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-px",
          `bg-gradient-to-r from-transparent ${meta.color.replace("text-", "via-")} to-transparent opacity-50`,
        )}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl border", meta.bg, meta.border)}>
            <Icon className={cn("w-5 h-5", meta.color)} />
          </div>
          <span
            className={cn(
              "text-[10px] font-bold font-mono tracking-widest px-2.5 py-1 rounded-full border",
              meta.color,
              meta.bg,
              meta.border,
            )}
          >
            {meta.badge}
          </span>
        </div>

        {/* Domain name */}
        <h3
          className={cn(
            "text-lg font-bold text-white mb-1 group-hover:transition-colors",
            `group-hover:${meta.color}`,
          )}
        >
          {domain.domain}
        </h3>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3 mb-5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>
              <span className="text-white font-semibold">{chunks}</span> input
              chunk{chunks !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>
              <span className="text-white font-semibold">{nistCount}</span> NIST
              control{nistCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Chunk preview — first chunk only, trimmed */}
        <div className="bg-[#080812] border border-white/5 rounded-xl p-3 text-xs text-slate-400 leading-relaxed line-clamp-3 font-mono">
          {Array.isArray(domain.text)
            ? `"${(domain.text[0] ?? "").slice(0, 200).trim()}…"`
            : `"${String(domain.text).slice(0, 200).trim()}…"`}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34B1AA]" />
            <span className="text-xs text-slate-500">Ready for analysis</span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              meta.color,
            )}
          >
            <span>Included</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── NIST Row (NIST Policies Tab) ────────────────────────────────────────────

function NistRow({ domain, index }: { domain: Domain; index: number }) {
  const meta = getMeta(domain.domain);
  const Icon = meta.icon;
  const policies = domain.related_nist_policies ?? [];
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className={cn(
        "rounded-xl border bg-[#0f0f1c] overflow-hidden",
        meta.border,
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={cn("p-2 rounded-lg", meta.bg)}>
            <Icon className={cn("w-4 h-4", meta.color)} />
          </div>
          <div className="text-left">
            <p className="text-white font-semibold text-sm">{domain.domain}</p>
            <p className="text-slate-500 text-xs mt-0.5">
              {policies.length} NIST control{policies.length !== 1 ? "s" : ""}{" "}
              matched
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn("text-lg font-extrabold tabular-nums", meta.color)}
          >
            {policies.length}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </button>

      {/* Expanded: just list policy previews (first 60 chars each) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
              {policies.map((policy, i) => {
                const firstLine = policy.split("\n")[0].trim();
                const preview =
                  firstLine.length > 90
                    ? firstLine.slice(0, 90) + "…"
                    : firstLine;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[#080812] border border-white/5"
                  >
                    <span
                      className={cn(
                        "text-[10px] font-bold font-mono mt-0.5 shrink-0 px-1.5 py-0.5 rounded",
                        meta.bg,
                        meta.color,
                      )}
                    >
                      P{String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {preview}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Stat Pill ───────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="flex items-center gap-4 bg-[#0f0f1c] border border-white/6 rounded-xl px-5 py-4">
      <div className={cn("p-2.5 rounded-xl", bg)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className={cn("text-2xl font-extrabold tabular-nums mt-0.5", color)}>
          {value}
        </p>
      </div>
    </div>
  );
}
