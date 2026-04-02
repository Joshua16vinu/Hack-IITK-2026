import {
  Shield,
  FileKey,
  ShieldAlert,
  Activity,
  Database,
  LucideIcon,
} from "lucide-react";

// Domain style mapping with full names (used in NIST policies page)
export const DOMAIN_STYLE: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; border: string }
> = {
  "Information Security Management System (ISMS)": {
    icon: Shield,
    color: "text-[#3B8FF3]",
    bg: "bg-[#3B8FF3]/8",
    border: "border-[#3B8FF3]/20",
  },
  "Data Privacy and Security": {
    icon: FileKey,
    color: "text-[#34B1AA]",
    bg: "bg-[#34B1AA]/8",
    border: "border-[#34B1AA]/20",
  },
  "Patch Management": {
    icon: ShieldAlert,
    color: "text-[#E0B50F]",
    bg: "bg-[#E0B50F]/8",
    border: "border-[#E0B50F]/20",
  },
  "Risk Management": {
    icon: Activity,
    color: "text-[#F29F67]",
    bg: "bg-[#F29F67]/8",
    border: "border-[#F29F67]/20",
  },
};

// Domain meta mapping with short names and badges (used in analysis view)
export const DOMAIN_META: Record<
  string,
  { color: string; bg: string; border: string; icon: LucideIcon; badge: string }
> = {
  ISMS: {
    color: "text-[#3B8FF3]",
    bg: "bg-[#3B8FF3]/10",
    border: "border-[#3B8FF3]/25",
    icon: Shield,
    badge: "ISMS",
  },
  "Risk Management": {
    color: "text-[#F29F67]",
    bg: "bg-[#F29F67]/10",
    border: "border-[#F29F67]/25",
    icon: Activity,
    badge: "RISK",
  },
  "Patch Management": {
    color: "text-[#E0B50F]",
    bg: "bg-[#E0B50F]/10",
    border: "border-[#E0B50F]/25",
    icon: ShieldAlert,
    badge: "PATCH",
  },
  "Data Privacy & Security": {
    color: "text-[#34B1AA]",
    bg: "bg-[#34B1AA]/10",
    border: "border-[#34B1AA]/25",
    icon: FileKey,
    badge: "PRIVACY",
  },
};

// Get style by full domain name (for NIST policies)
export const getStyle = (name: string) =>
  DOMAIN_STYLE[name] ?? {
    icon: Database,
    color: "text-slate-400",
    bg: "bg-slate-100",
    border: "border-slate-200",
  };

// Get style by short domain name (for analysis view)
export const getFallbackMeta = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("risk"))
    return {
      ...DOMAIN_META["Risk Management"],
      badge: name.slice(0, 4).toUpperCase(),
    };
  if (n.includes("patch"))
    return {
      ...DOMAIN_META["Patch Management"],
      badge: name.slice(0, 4).toUpperCase(),
    };
  if (n.includes("data") || n.includes("privacy"))
    return {
      ...DOMAIN_META["Data Privacy & Security"],
      badge: name.slice(0, 4).toUpperCase(),
    };
  return {
    color: "text-[#3B8FF3]",
    bg: "bg-[#3B8FF3]/10",
    border: "border-[#3B8FF3]/25",
    icon: Database,
    badge: name.slice(0, 4).toUpperCase(),
  };
};

export const getMeta = (name: string) =>
  DOMAIN_META[name] ?? getFallbackMeta(name);
