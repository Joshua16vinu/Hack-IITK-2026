"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Logo from "@/app/logo.svg";
import type { AppTopBarProps } from "@/types";
import { Zap, Brain, Sparkles, ChevronDown, Check } from "lucide-react";

interface ModeConfig {
  id: string;
  recommended?: boolean;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const MODES: ModeConfig[] = [
  {
    id: "auto",
    recommended: true,
    label: "Auto",
    description: "Best mix of speed and accuracy",
    icon: Sparkles,
    color: "blue",
  },
  {
    id: "rapid",
    label: "Rapid",
    description: "Get results faster with efficient analysis",
    icon: Zap,
    color: "amber",
  },
  {
    id: "deep",
    label: "Deep",
    description: "Think longer for better answers",
    icon: Brain,
    color: "violet",
  },
];

export function AppTopBar({ section, actions }: AppTopBarProps) {
  const pathname = usePathname();
  const [mode, setMode] = useState<string>(MODES[0].id);
  const [open, setOpen] = useState(false);
  const isHomeRoute = pathname === "/";
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeMode = MODES.find((m) => m.id === mode) ?? MODES[0];

  useEffect(() => {
    const savedMode = localStorage.getItem("mode");
    if (savedMode && MODES.some((m) => m.id === savedMode)) {
      queueMicrotask(() => setMode(savedMode));
    }
  }, []);


  const handleModeChange = (newMode: string) => {
    setMode(newMode);
    localStorage.setItem("mode", newMode);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
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
        <Link
          className="font-extrabold text-slate-900 tracking-tight text-lg"
          href="/"
        >
          Policy<span className="text-blue-600">Guard</span>
        </Link>
        {section && <span className="text-slate-300 mx-1">/</span>}
        <span className="text-slate-500 font-semibold text-sm">{section}</span>

        {!isHomeRoute && section && (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-semibold text-${activeMode.color}-600 border-${activeMode.color}-100 bg-${activeMode.color}-50`}
          >
            <activeMode.icon
              className={`w-3.5 h-3.5 text-${activeMode.color}-500`}
            />
            {activeMode.label}
          </span>
        )}
      </div>

      {/* Mode Dropdown */}
      {isHomeRoute && (
        <div ref={dropdownRef} className="relative">
          {/* Trigger */}
          <button
            id="mode-dropdown-trigger"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <activeMode.icon
              className={`w-4 h-4 text-${activeMode.color}-500`}
            />
            <span className="text-slate-800">{activeMode.label} Mode</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute top-[calc(100%+2px)] right-0 w-84 bg-white rounded-2xl border border-slate-100 shadow-2xl shadow-slate-900/10 z-[100] py-2">
              {MODES.map((m) => {
                const isActive = m.id === activeMode.id;
                return (
                  <div key={m.id} className="px-2">
                    <button
                      id={`mode-option-${m.id}`}
                      onClick={() => handleModeChange(m.id)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 hover:bg-slate-50"
                    >
                      {/* Icon */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-slate-100">
                        <m.icon className={`w-4 h-4 text-${m.color}-500`} />
                      </div>

                      {/* Label + description */}
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold leading-none text-slate-800">
                            {m.label}
                          </span>
                          {m.recommended && (
                            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-blue-600 text-white leading-none tracking-wide">
                              Recommended
                            </span>
                          )}
                        </div>
                        <span className="text-xs leading-snug text-slate-400 min-w-0 truncate">
                          {m.description}
                        </span>
                      </div>

                      {/* Checkmark */}
                      {isActive && (
                        <Check className="w-4 h-4 shrink-0 text-green-500" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Right: Actions */}
      {actions && <div className="flex items-center gap-4">{actions}</div>}
    </header>
  );
}
