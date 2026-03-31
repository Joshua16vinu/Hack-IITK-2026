import { Bell, Search, Shield, ChevronRight } from 'lucide-react'
import { Policy } from '@/components/features/analysis/PolicyDetailsModal'

interface HeaderProps {
    onSelectPolicy: (policy: Policy | null) => void
}

export function Header({ onSelectPolicy }: HeaderProps) {
    return (
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-200 bg-white/90 backdrop-blur-xl sticky top-0 z-40 relative shadow-sm">
            {/* Context Links */}
            <div className="flex items-center gap-2 text-sm text-slate-500 hidden sm:flex">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:border-[#F29F67]/30 transition-colors group cursor-pointer">
                    <Shield className="w-4 h-4 text-[#F29F67] transition-colors" />
                    <span className="font-semibold text-slate-700 transition-all">Security Operations</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-900 tracking-tight">Policy Analysis</span>
            </div>

            {/* Global Actions */}
            <div className="flex items-center gap-4 ml-auto">
                <PolicySelector onSelect={onSelectPolicy} />

                <div className="w-px h-6 bg-slate-200 mx-2" />

                <button className="relative p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all group" suppressHydrationWarning>
                    <Bell className="w-5 h-5 group-hover:text-[#F29F67] transition-colors" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white shadow-sm" />
                </button>

                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#F29F67] to-[#3B8FF3] flex items-center justify-center text-white font-bold text-sm cursor-pointer shadow-md hover:shadow-lg hover:scale-105 transition-all">
                    JD
                </div>
            </div>
        </header>
    )
}

function PolicySelector({ onSelect }: { onSelect: (p: Policy | null) => void }) {
    const policies: Policy[] = [
        {
            id: 'AC-1', name: 'Access Control',
            definition: 'Limit information system access to authorized users, processes acting on behalf of authorized users, or devices (including other information systems) and to the types of transactions and functions that authorized users are permitted to exercise.',
            type: 'Technical', priority: 'High', family: 'Access Control (AC)'
        },
        {
            id: 'IA-2', name: 'Identification & Authentication',
            definition: 'Identify information system users, processes acting on behalf of users, or devices and authenticate (or verify) the identities of those users, processes, or devices, as a prerequisite to allowing access to organizational information systems.',
            type: 'Technical', priority: 'Critical', family: 'Identification & Auth (IA)'
        },
        {
            id: 'IR-4', name: 'Incident Handling',
            definition: 'Establish an operational incident handling capability for organizational information systems that includes adequate preparation, detection, analysis, containment, recovery, and user response activities.',
            type: 'Operational', priority: 'High', family: 'Incident Response (IR)'
        },
        {
            id: 'RA-3', name: 'Risk Assessment',
            definition: 'Periodically assess the risk to organizational operations (including mission, functions, image, or reputation), organizational assets, and individuals, resulting from the operation of organizational information systems and the associated processing, storage, or transmission of organizational information.',
            type: 'Management', priority: 'Medium', family: 'Risk Assessment (RA)'
        },
    ]

    return (
        <div className="relative group hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                <Search className="h-4 w-4 text-slate-400 group-hover:text-[#F29F67] transition-colors" />
            </div>
            <select
                onChange={(e) => onSelect(policies.find(x => x.id === e.target.value) || null)}
                value=""
                className="bg-slate-50 border border-slate-200 text-slate-700 font-medium text-sm rounded-xl focus:ring-2 focus:ring-[#F29F67]/50 focus:border-[#F29F67]/50 block w-72 pl-10 p-2.5 appearance-none cursor-pointer hover:bg-white hover:border-slate-300 transition-all outline-none shadow-sm"
            >
                <option value="" disabled>Search Security Controls...</option>
                {policies.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-400">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </div>
        </div>
    )
}
