import { Loader2, BookOpen, ShieldCheck } from "lucide-react";
import { DomainEntry, GapResult } from "@/types";
import { getMeta } from "@/data/domainStyles";
import { cn } from "@/lib/utils";
import type { ResultsSidebarProps } from "@/types";

export function ResultsSidebar({
  domains,
  activeDomainIdx,
  onSelectDomain,
  totalNist,
  getDomainGapData,
}: ResultsSidebarProps) {
  return (
    <div className="w-80 shrink-0 bg-white border-r border-slate-200 flex flex-col z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50">
        <div className="mb-6">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Global Summary
          </h2>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            {domains.length} Domains
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-50/20 border border-blue-100/50 rounded-xl p-3 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
          <div className="flex items-center gap-1.5 mb-1.5 text-blue-500">
            <BookOpen className="w-3.5 h-3.5" />
            <p className="text-[10px] font-bold uppercase tracking-widest leading-none">
              Total NIST Controls
            </p>
          </div>
          <p className="text-xl font-extrabold text-blue-700 leading-none">
            {totalNist}
          </p>
        </div>
      </div>

      <div className="p-4 px-6 pt-5">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Detected Domains
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
        {domains.map((domainItem, index) => {
          const isActive = index === activeDomainIdx;
          const {
            icon: DomainIcon,
            color,
            bg,
            border,
          } = getMeta(domainItem.domain);
          const nistCount = domainItem.related_nist_policies?.length || 0;
          const domainGapData = getDomainGapData(domainItem.domain);
          const gapCount = domainGapData?.gaps?.length || 0;

          return (
            <button
              key={domainItem.domain}
              onClick={() => onSelectDomain(index)}
              className={cn(
                "w-full text-left p-4 rounded-2xl transition-all border relative overflow-hidden group",
                isActive
                  ? cn("shadow-sm", border, bg)
                  : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200",
              )}
            >
              {isActive && (
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1",
                    color.replace("text", "bg"),
                  )}
                />
              )}

              <div className="flex items-center gap-2 mb-2">
                <div
                  className={cn(
                    "p-2 rounded-lg flex items-center justify-center",
                    bg,
                  )}
                >
                  <DomainIcon className={cn("w-4 h-4", color)} />
                </div>
                <h3
                  className={cn(
                    "font-bold text-sm line-clamp-1",
                    isActive ? color : "text-slate-700",
                    "transition-colors",
                  )}
                >
                  {domainItem.domain}
                </h3>
              </div>

              <div className="flex items-center gap-3 text-xs font-semibold ml-9">
                <span className={isActive ? color : "text-slate-500"}>
                  {nistCount} controls
                </span>
                <span className="text-slate-300">•</span>
                <span className={isActive ? color : "text-slate-500"}>
                  {!domainGapData ? (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Loader2 className="w-3 h-3 animate-spin" /> Analyzing
                      gaps
                    </span>
                  ) : domainGapData.status === "processing" ? (
                    gapCount > 0 ? (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        {gapCount} gaps (updating)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500">
                        <Loader2 className="w-3 h-3 animate-spin" /> Analyzing
                        gaps
                      </span>
                    )
                  ) : domainGapData.status === "completed" ? (
                    <span className={isActive ? color : "text-slate-500"}>
                      {gapCount} gaps
                    </span>
                  ) : (
                    <span className="text-slate-400">Failed</span>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
