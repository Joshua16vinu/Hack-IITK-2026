import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import type { ErrorBannerProps } from "@/types";

export function ErrorBanner({ message, action }: ErrorBannerProps) {
  return (
    <div className="w-full bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-8 flex items-start gap-4 shadow-sm">
      <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <h3 className="font-bold mb-1">Error</h3>
        <p className="text-sm font-medium opacity-90">{message}</p>
      </div>
      {action}
    </div>
  );
}
