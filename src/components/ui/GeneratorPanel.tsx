import type { GeneratorPanelProps } from "@/types";

export function GeneratorPanel({
  header,
  action,
  children,
}: GeneratorPanelProps) {
  return (
    <div className="flex-1 w-full bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col min-h-[600px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-6 border-b border-slate-100 gap-4 shrink-0">
        {header}
        {action}
      </div>
      {children}
    </div>
  );
}
