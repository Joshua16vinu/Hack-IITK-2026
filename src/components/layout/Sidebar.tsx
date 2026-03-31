import {
    ShieldCheck, LayoutDashboard, Search, User, BookOpen, ChevronRight, LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'

export function Sidebar({ setActiveTab, activeTab }: any) {
    const [collapsed, setCollapsed] = useState(false)

    const items = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
        { id: 'scan', icon: Search, label: 'Audit Log' },
    ]

    return (
        <motion.div
            initial={{ width: 240 }}
            animate={{ width: collapsed ? 72 : 240 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="h-screen bg-white border-r border-slate-200 flex flex-col z-50 sticky top-0 shadow-lg shadow-slate-200/50"
        >
            {/* Brand */}
            <div className="h-16 flex items-center px-6 border-b border-slate-200 relative overflow-hidden group">
                <div className="w-8 h-8 rounded-lg bg-[#F29F67] flex items-center justify-center shrink-0 shadow-md">
                    <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <motion.div
                    initial={{ opacity: 1, width: 'auto' }}
                    animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
                    className="ml-3 font-bold text-slate-900 tracking-tight overflow-hidden whitespace-nowrap"
                >
                    Policy<span className="text-[#F29F67]">Guard</span>
                </motion.div>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-6 px-3 space-y-1">
                <div className={cn("text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3", collapsed && "text-center")}>
                    {collapsed ? "Main" : "Workspace"}
                </div>

                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveTab?.(item.id)}
                        suppressHydrationWarning
                        className={cn(
                            "w-full flex items-center px-3 py-2.5 rounded-xl transition-all group relative duration-200",
                            activeTab === item.id
                                ? "bg-orange-50 text-[#F29F67] font-semibold"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", activeTab === item.id ? "text-[#F29F67]" : "text-slate-400 group-hover:text-slate-600")} />

                        <motion.span
                            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
                            className="ml-3 text-sm whitespace-nowrap overflow-hidden"
                        >
                            {item.label}
                        </motion.span>
                    </button>
                ))}
            </div>

            <div className="px-3 pb-4 mt-2">
                <Link
                    href="/nist-policies"
                    className={cn(
                        "w-full flex items-center px-3 py-2.5 rounded-xl transition-all group relative duration-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                >
                    <BookOpen className="w-5 h-5 shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    <motion.span
                        animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
                        className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                        NIST Policies
                    </motion.span>
                </Link>
            </div>

            <div className="p-4 border-t border-slate-200">
                <div className={cn("flex items-center p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group", collapsed && "justify-center")}>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <User className="w-4 h-4" />
                    </div>

                    <motion.div
                        animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : 'auto' }}
                        className="ml-3 overflow-hidden whitespace-nowrap"
                    >
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-[#F29F67] transition-colors">Admin User</p>
                        <p className="text-xs text-slate-500">Security Team</p>
                    </motion.div>
                </div>

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    suppressHydrationWarning
                    className="w-full mt-4 flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 transition-colors text-xs uppercase tracking-wider font-bold border-t border-slate-100 pt-4"
                >
                    {collapsed ? "Exp" : "Collapse View"}
                </button>
            </div>
        </motion.div>
    )
}
