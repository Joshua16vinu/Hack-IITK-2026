import { ReactNode } from "react";
import type { PageContainerProps } from "@/types";

export function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <main
      className={`flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 flex flex-col ${className}`}
    >
      {children}
    </main>
  );
}
