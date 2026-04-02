import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  Loader2,
  AlertCircle,
  BookOpen,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { DomainEntry, GapResult } from "./types";
import { StreamingText } from "./StreamingText";

interface ResultsDomainDetailsProps {
  domain: DomainEntry;
  activeDomainIdx: number;
  activeNist: number;
  activeGapData?: GapResult;
}

export function ResultsDomainDetails({
  domain,
  activeDomainIdx,
  activeNist,
  activeGapData,
}: ResultsDomainDetailsProps) {
  const activeGapsCount = activeGapData?.gaps?.length || 0;
  const [completedPolicyIds, setCompletedPolicyIds] = useState<string[]>([]);
  const [completedGapIds, setCompletedGapIds] = useState<string[]>([]);

  const policyIds = domain.related_nist_policies.map(
    (_, policyIndex) => `${domain.domain}_nist_${policyIndex}`,
  );
  const activePolicyStreamIndex = policyIds.findIndex(
    (policyId) => !completedPolicyIds.includes(policyId),
  );

  const gapIds =
    activeGapData?.gaps?.map(
      (_, gapIndex) => `gap_${domain.domain}_${gapIndex}`,
    ) ?? [];

  const activeGapStreamIndex = gapIds.findIndex(
    (gapId) => !completedGapIds.includes(gapId),
  );

  const handlePolicyStreamComplete = (policyId: string) => {
    setCompletedPolicyIds((current) => {
      if (current.includes(policyId)) {
        return current;
      }

      return [...current, policyId];
    });
  };

  const handleGapStreamComplete = (gapId: string) => {
    setCompletedGapIds((current) => {
      if (current.includes(gapId)) {
        return current;
      }

      return [...current, gapId];
    });
  };

  return (
    <div className="flex-1 relative overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 bg-[#f8f9fc] p-8 lg:p-12">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDomainIdx}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.2 }}
          className="max-w-4xl mx-auto space-y-8 pb-32"
        >
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start justify-between relative z-10 gap-8">
              <div className="space-y-4 flex-1">
                <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-tight leading-tight">
                  {domain.domain}
                </h1>
                <p className="text-slate-500 font-medium max-w-xl text-base leading-relaxed">
                  This domain encapsulates policies related to{" "}
                  <strong className="text-slate-700">{domain.domain}</strong>.
                  Review the associated standards mapped below.
                </p>
              </div>

              <div className="hidden sm:flex items-center gap-4 bg-[#f8f9fc] rounded-3xl p-5 border border-slate-100 shadow-inner shrink-0">
                <div className="text-center px-4">
                  <p className="text-4xl font-black text-blue-600">
                    {activeNist}
                  </p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">
                    NIST Controls
                  </p>
                </div>
                <div className="w-px h-16 bg-slate-200" />
                <div className="text-center px-4">
                  {!activeGapData || activeGapData.status === "processing" ? (
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-red-500 mb-2" />
                  ) : (
                    <p className="text-4xl font-black text-red-500">
                      {activeGapsCount}
                    </p>
                  )}
                  <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-1">
                    Identified Gaps
                  </p>
                </div>
              </div>
            </div>
          </div>

          {activeGapData?.status === "completed" &&
            activeGapData.gaps &&
            activeGapData.gaps.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      Identified Gaps
                    </h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="group relative bg-white rounded-2xl p-6 border border-red-100 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    {activeGapData.gaps.map((gap, gapIndex) => {
                      const gapId = `gap_${domain.domain}_${gapIndex}`;

                      const isAlreadyCompleted =
                        completedGapIds.includes(gapId);

                      const isActiveNow =
                        activeGapStreamIndex === -1
                          ? false
                          : gapIndex === activeGapStreamIndex;

                      if (!isActiveNow && !isAlreadyCompleted) return null;

                      return (
                        <div
                          className="flex items-start gap-4 relative z-10"
                          key={`${domain.domain}-${gapIndex}`}
                        >
                          <div className="w-2.5 h-2.5 mt-2 shrink-0 rounded-full bg-red-400" />

                          <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed font-medium">
                            <StreamingText
                              text={gap}
                              id={gapId}
                              speed={100}
                              start={isAlreadyCompleted || isActiveNow}
                              onComplete={() => handleGapStreamComplete(gapId)}
                            />
                          </p>
                        </div>
                      );
                    })}
                  </motion.div>
                </div>
              </div>
            )}

          {activeNist > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    Relevant NIST Controls
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {domain.related_nist_policies.map((policyText, policyIndex) => {
                  const policyId = `${domain.domain}_nist_${policyIndex}`;
                  const isAlreadyCompleted =
                    completedPolicyIds.includes(policyId);
                  const isActiveNow =
                    activePolicyStreamIndex === -1
                      ? false
                      : policyIndex === activePolicyStreamIndex;

                  if (!isActiveNow && !isAlreadyCompleted) return null;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + policyIndex * 0.04 }}
                      key={`${domain.domain}-policy-${policyIndex}`}
                      className="group relative bg-white rounded-3xl p-7 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="flex items-start gap-5 relative z-10">
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#f8f9fc] border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors duration-300">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-700 text-slate-500 text-[10px] font-black tracking-widest uppercase rounded-lg transition-colors">
                              CONTROL {String(policyIndex + 1).padStart(2, "0")}
                            </span>
                          </div>
                          <p className="text-sm md:text-[15px] text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                            <StreamingText
                              text={policyText}
                              id={policyId}
                              speed={100}
                              start={isAlreadyCompleted || isActiveNow}
                              onComplete={() =>
                                handlePolicyStreamComplete(policyId)
                              }
                            />
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center border-2 border-slate-200 border-dashed">
              <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                No Controls Found
              </h3>
              <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-md mx-auto">
                The semantic analysis engine did not map any NIST standards for
                the input chunks in this domain.
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
