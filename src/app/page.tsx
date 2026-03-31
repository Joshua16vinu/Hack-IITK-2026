'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { UploadZone } from '@/features/upload/UploadZone'
import { ShieldCheck, ShieldAlert, FileKey, Activity, Component, Hexagon, CircleDashed } from 'lucide-react'
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
        // Normalize: old cache may have stored the full API response object
        const domains = Array.isArray(parsed) ? parsed : (parsed?.result ?? [])
        setUploadedDomains(domains)
      } catch (e) {
        console.error("Failed to parse cached domains", e)
      }
    }
  }, [])

  const handleUploadSuccess = (data: any) => {
    // Backend returns { file_id, cached, result: [...] }
    const domains = Array.isArray(data) ? data : (data?.result ?? [])
    setUploadedDomains(domains)
    localStorage.setItem('uploadedDomains', JSON.stringify(domains))
    setActiveTab('domain-selection')
  }

  const handleDomainSelect = async (domainObj: any) => {
    setIsAnalyzing(true)
    // Small delay to let the UI update and show the loader smoothly
    await new Promise(r => setTimeout(r, 500))

    try {
      const res = await axios.post('http://127.0.0.1:5000/api/analyze-domain', domainObj)
      setAnalysisResult(res.data)
      setActiveTab('scan')
    } catch (error) {
      console.error("Analysis failed", error)
      // Ideally show an error toast here
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReturnToDomains = () => {
    setAnalysisResult(null)
    setActiveTab('domain-selection')
  }

  const handleReset = () => {
    // This is a full reset
    setAnalysisResult(null)
    setUploadedDomains([])
    localStorage.removeItem('uploadedDomains')
    setActiveTab('dashboard')
  }

  return (
    <div className="flex h-screen overflow-hidden selection:bg-blue-100 selection:text-blue-900 font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col relative overflow-hidden bg-[#f8f9fc]">
        <Header onSelectPolicy={setSelectedPolicy} />

        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full flex justify-center min-h-full p-6 lg:p-12 relative"
              >
                
                {/* Background Ambient Decoratives */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-orange-50/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

                <div className="w-full max-w-[1600px] grid grid-cols-1 xl:grid-cols-2 gap-16 items-center flex-1 relative z-10">
                  
                  {/* LEFT: HERO SECTION */}
                  <div className="space-y-10 pl-4 xl:pl-8">
                    
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold text-slate-700 tracking-wider">SYSTEM ONLINE</span>
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
                  <div className="w-full xl:pl-12 flex justify-center xl:justify-end">
                    <div className="w-full max-w-xl">
                      <UploadZone onSuccess={handleUploadSuccess} />
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <PolicyDetailsModal policy={selectedPolicy} onClose={() => setSelectedPolicy(null)} />
      </div>
    </div>
  )
}
