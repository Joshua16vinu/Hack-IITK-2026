"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/app/logo.svg";
import type { AppTopBarProps } from "@/types";
import { useMode } from "@/context/ModeContext";
import type { AnalysisMode } from "@/context/ModeContext";
import { Zap, Brain, Sparkles, ChevronDown, Check } from "lucide-react";

interface ModeConfig {
  id: AnalysisMode;
  label: string;
  description: string;
  recommended?: boolean;
  icon: React.ElementType;
  iconColor: string;
  activeIconBg: string;
  activeLabelColor: string;
  activeDescColor: string;
  activeRowBg: string;
  triggerStyle: string;
}

const MODES: ModeConfig[] = [
  {
    id: "rapid",
    label: "Rapid",
    description: "Get results faster with efficient analysis.",
    icon: Zap,
    iconColor: "text-amber-500",
    activeIconBg: "bg-amber-50",
    activeLabelColor: "text-amber-700",
    activeDescColor: "text-amber-500/80",
    activeRowBg: "bg-amber-50/60",
    triggerStyle: "border-amber-200 bg-amber-50 text-amber-700",
  },
  {
    id: "smart",
    label: "Smart",
    description: "Think smarter for the most accurate and balanced results.",
    recommended: true,
    icon: Sparkles,
    iconColor: "text-blue-500",
    activeIconBg: "bg-blue-50",
    activeLabelColor: "text-blue-700",
    activeDescColor: "text-blue-400/80",
    activeRowBg: "bg-blue-50/60",
    triggerStyle: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    id: "deep",
    label: "Deep",
    description: "Think longer for the better answer.",
    icon: Brain,
    iconColor: "text-violet-500",
    activeIconBg: "bg-violet-50",
    activeLabelColor: "text-violet-700",
    activeDescColor: "text-violet-400/80",
    activeRowBg: "bg-violet-50/60",
    triggerStyle: "border-violet-200 bg-violet-50 text-violet-700",
  },
];

export function AppTopBar({ section, actions }: AppTopBarProps) {
  const { mode, setMode } = useMode();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeMode = MODES.find((m) => m.id === mode) ?? MODES[1];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="shrink-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm z-50 px-6 flex items-center justify-between sticky top-0">

      {/* Left: Logo + Brand + Section */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center">
          <Image src={Logo} alt="PolicyGuard Logo" height={30} width={30} />
        </div>
        <Link className="font-extrabold text-slate-900 tracking-tight text-lg" href="/">
          Policy<span className="text-blue-600">Guard</span>
        </Link>
        {section && <span className="text-slate-300 mx-1">/</span>}
        <span className="text-slate-500 font-semibold text-sm">{section}</span>
      </div>

      {/* Centre: Mode Dropdown */}
      <div ref={dropdownRef} className="relative">

        {/* Trigger */}
        <button
          id="mode-dropdown-trigger"
          onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md ${activeMode.triggerStyle}`}
        >
          <activeMode.icon className={`w-4 h-4 ${activeMode.iconColor}`} />
          <span>{activeMode.label} Mode</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown panel */}
        {open && (
          <div className="absolute top-[calc(100%+8px)] right-0 w-72 bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-900/10 z-[100] py-2">
            {MODES.map((m) => {
              const isActive = mode === m.id;
              return (
                <div key={m.id} className="px-2">
                  <button
                    id={`mode-option-${m.id}`}
                    onClick={() => { setMode(m.id); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 ${
                      isActive ? m.activeRowBg : "hover:bg-slate-50"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? m.activeIconBg : "bg-slate-100"}`}>
                      <m.icon className={`w-4 h-4 ${m.iconColor}`} />
                    </div>

                    {/* Label + description */}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold leading-none ${isActive ? m.activeLabelColor : "text-slate-800"}`}>
                          {m.label}
                        </span>
                        {m.recommended && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white leading-none tracking-wide">
                            ★ Recommended
                          </span>
                        )}
                      </div>
                      <span className={`text-[11px] font-medium leading-snug ${isActive ? m.activeDescColor : "text-slate-400"}`}>
                        {m.description}
                      </span>
                    </div>

                    {/* Checkmark */}
                    {isActive && (
                      <Check className={`w-4 h-4 shrink-0 ${m.activeLabelColor}`} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Actions */}
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </header>
  );
}
