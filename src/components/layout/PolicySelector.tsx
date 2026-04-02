import { Search } from "lucide-react";
import { Policy } from "@/components/features/analysis/PolicyDetailsModal";

interface PolicySelectorProps {
  onSelect: (policy: Policy | null) => void;
}

const policies: Policy[] = [
  {
    id: "AC-1",
    name: "Access Control",
    definition:
      "Limit information system access to authorized users, processes acting on behalf of authorized users, or devices (including other information systems) and to the types of transactions and functions that authorized users are permitted to exercise.",
    type: "Technical",
    priority: "High",
    family: "Access Control (AC)",
  },
  {
    id: "IA-2",
    name: "Identification & Authentication",
    definition:
      "Identify information system users, processes acting on behalf of users, or devices and authenticate (or verify) the identities of those users, processes, or devices, as a prerequisite to allowing access to organizational information systems.",
    type: "Technical",
    priority: "Critical",
    family: "Identification & Auth (IA)",
  },
  {
    id: "IR-4",
    name: "Incident Handling",
    definition:
      "Establish an operational incident handling capability for organizational information systems that includes adequate preparation, detection, analysis, containment, recovery, and user response activities.",
    type: "Operational",
    priority: "High",
    family: "Incident Response (IR)",
  },
  {
    id: "RA-3",
    name: "Risk Assessment",
    definition:
      "Periodically assess the risk to organizational operations (including mission, functions, image, or reputation), organizational assets, and individuals, resulting from the operation of organizational information systems and the associated processing, storage, or transmission of organizational information.",
    type: "Management",
    priority: "Medium",
    family: "Risk Assessment (RA)",
  },
];

export function PolicySelector({ onSelect }: PolicySelectorProps) {
  return (
    <div className="relative group hidden sm:block">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
        <Search className="h-4 w-4 text-slate-400 group-hover:text-[#F29F67] transition-colors" />
      </div>
      <select
        onChange={(e) =>
          onSelect(policies.find((item) => item.id === e.target.value) || null)
        }
        value=""
        className="bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl focus:ring-2 focus:ring-[#F29F67]/50 focus:border-[#F29F67]/50 block w-72 pl-10 p-2.5 appearance-none cursor-pointer hover:bg-white hover:border-slate-300 transition-all outline-none shadow-sm"
      >
        <option value="" disabled>
          Search Security Controls...
        </option>
        {policies.map((policy) => (
          <option key={policy.id} value={policy.id}>
            {policy.name}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-400">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>
    </div>
  );
}
