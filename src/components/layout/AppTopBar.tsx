import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/app/logo.svg"

interface AppTopBarProps {
  section?: string;
  actions?: ReactNode;
}

export function AppTopBar({ section, actions }: AppTopBarProps) {
  return (
    <header className="shrink-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm z-50 px-6 flex items-center justify-between sticky top-0">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 flex items-center justify-center">
          <Image
            src={Logo}
            alt="PolicyGuard Logo"
            height={32}
            width={32}
          />
        </div>
        <Link
          className="font-extrabold text-slate-900 tracking-tight text-lg"
          href="/"
        >
          Policy<span className="text-blue-600">Guard</span>
        </Link>
        {section && <span className="text-slate-300 mx-2">/</span>}
        <span className="text-slate-500 font-semibold text-sm">{section}</span>
      </div>
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </header>
  );
}
