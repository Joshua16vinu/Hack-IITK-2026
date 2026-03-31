'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { UploadZone } from '@/features/upload/UploadZone'
import { ShieldCheck, Hexagon, CircleDashed, BookOpen } from 'lucide-react'
import { PolicyDetailsModal, Policy } from '@/components/features/analysis/PolicyDetailsModal'

export default function EnterpriseDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [uploadedDomains, setUploadedDomains] = useState<any[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)

  useEffect(() => {
    const cached = localStorage.getItem('uploadedDomains')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        const domains = Array.isArray(parsed) ? parsed : (parsed?.result ?? [])
        setUploadedDomains(domains)
      } catch (e) {
        console.error("Failed to parse cached domains", e)
      }
    }
  }, [])

  const handleUploadSuccess = (data: any) => {
    const domains = Array.isArray(data) ? data : (data?.result ?? [])
    setUploadedDomains(domains)
    localStorage.setItem('uploadedDomains', JSON.stringify(domains))
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden selection:bg-blue-100 selection:text-blue-900 font-sans bg-[#f8f9fc]">
      {/* Restored Top Header */}
      <Header onSelectPolicy={setSelectedPolicy} />

      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex justify-center min-h-full p-6 lg:p-12 relative"
            >
              
              {/* Background Ambient Decoratives (Fixed overflow) */}
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-50/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

              <div className="w-full max-w-[1400px] grid grid-cols-1 xl:grid-cols-2 gap-16 items-center flex-1 relative z-10 mt-8 xl:mt-0">
                
                {/* LEFT: HERO SECTION */}
                <div className="space-y-10 pl-4">
                  
                  {/* Brand / Links Row */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-700 tracking-wider">SYSTEM ONLINE</span>
                    </div>

                    <Link href="/nist-policies" className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white border border-slate-200 shadow-sm shadow-blue-900/5 hover:border-blue-300 hover:shadow-md transition-all text-slate-700 hover:text-blue-700 group focus:ring-2 focus:ring-blue-500/20 outline-none">
                      <BookOpen className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform duration-300" />
                      <span className="text-xs font-bold tracking-widest uppercase">Browse NIST Policies</span>
                    </Link>
                  </div>

                  <div className="space-y-6 relative">
                     <CircleDashed className="absolute -top-10 -left-10 w-32 h-32 text-slate-100 rotate-45 pointer-events-none" strokeWidth={1} />
                     <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tighter leading-[1.1]">
                        Intelligent <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-[#3B8FF3] to-[#F29F67]">
                          Policy Audit.
                        </span>
                     </h1>
                     <p className="text-lg lg:text-xl text-slate-500 max-w-xl font-medium leading-relaxed">
                        Harness AI-driven semantics to map your organization's unstructured documents directly to NIST SP 800-53 controls with unparalleled precision.
                     </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    
                    {/* Premium Feature 1 */}
                    <div className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                      <ShieldCheck className="w-8 h-8 text-blue-600 mb-4 relative z-10" />
                      <h3 className="text-lg font-bold text-slate-900 mb-2 relative z-10">Privacy First</h3>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed relative z-10">
                        Operates entirely offline. No critical business intelligence leaves your local environment.
                      </p>
                    </div>

                    {/* Premium Feature 2 */}
                    <div className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                      <Hexagon className="w-8 h-8 text-[#F29F67] mb-4 relative z-10" />
                      <h3 className="text-lg font-bold text-slate-900 mb-2 relative z-10">Intelligent Mapping</h3>
                      <p className="text-sm font-medium text-slate-500 leading-relaxed relative z-10">
                        Automated semantic chunking perfectly aligns custom policies to global standards.
                      </p>
                    </div>

                  </div>
                </div>

                {/* RIGHT: UPLOAD COMPONENT */}
                <div className="w-full xl:pl-12 flex justify-center xl:justify-end z-10">
                  <div className="w-full max-w-xl">
                    <UploadZone onSuccess={handleUploadSuccess} />
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Restore Policy Details Modal which was connected to the Header Search */}
      <PolicyDetailsModal policy={selectedPolicy} onClose={() => setSelectedPolicy(null)} />
    </div>
  )
}
