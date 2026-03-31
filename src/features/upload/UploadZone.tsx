'use client'

import { useState, useRef, DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, ChevronDown, ShieldCheck, X, FileText, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadProps {
    onSuccess: (data: any) => void
}

const DOMAINS = [
    { value: 'ISMS', label: 'ISMS', description: 'Information Security Management System' },
    { value: 'Risk Management', label: 'Risk Management', description: 'Risk Assessment & Response Strategies' },
    { value: 'Patch Management', label: 'Patch Management', description: 'System Integrity & Update Management' },
    { value: 'Data Privacy & Security', label: 'Data Privacy & Security', description: 'Data Protection & Privacy Controls' },
]

const PROCESSING_LOGS = ['Extracting text from PDF...', 'Chunking document content...', 'Running semantic classification...', 'Querying NIST SP 800-53 database...', 'Mapping to control families...', 'Finalizing analysis...']

export function UploadZone({ onSuccess }: UploadProps) {
    const router = useRouter()
    const [file, setFile] = useState<File | null>(null)
    const [selectedDomain, setSelectedDomain] = useState<string>('')
    const [isDomainOpen, setIsDomainOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [progress, setProgress] = useState(0)
    const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const [logIndex, setLogIndex] = useState(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedDomainObj = DOMAINS.find(d => d.value === selectedDomain)

    const handleFile = (f: File) => {
        if (f.type !== 'application/pdf') {
            setStatus('error'); setErrorMsg('Invalid file format. Please upload a PDF document.'); return
        }
        if (f.size > 10 * 1024 * 1024) {
            setStatus('error'); setErrorMsg('File exceeds 10MB limit. Please upload a smaller file.'); return
        }
        setFile(f); upload(f)
    }

    const upload = async (f: File) => {
        setStatus('uploading'); setProgress(0); setLogIndex(0)
        const formData = new FormData()
        formData.append('file', f)
        if (selectedDomain) formData.append('domain', selectedDomain)

        let logTimer: ReturnType<typeof setInterval>
        try {
            const uploadRes = await axios.post('http://localhost:5000/api/upload-pdf', formData, {
                onUploadProgress: (p) => setProgress(Math.min(Math.round((p.loaded * 100) / (p.total || 1)), 30))
            })
            setStatus('processing'); setProgress(35)
            let i = 0
            logTimer = setInterval(() => {
                i++; setLogIndex(i); setProgress(Math.min(35 + i * 10, 92))
                if (i >= PROCESSING_LOGS.length - 1) clearInterval(logTimer)
            }, 550)
            await new Promise(r => setTimeout(r, 3500))
            clearInterval(logTimer)
            setProgress(100); setStatus('success')
            
            setTimeout(() => {
                // Ensure successful processing triggers navigation without tab update
                localStorage.setItem('uploadedDomains', JSON.stringify(uploadRes.data))
                onSuccess(uploadRes.data)
                router.push('/results')
            }, 900)
        } catch (err: any) {
            if (logTimer!) clearInterval(logTimer)
            setStatus('error')
            const detail = err?.response?.data?.detail
            setErrorMsg(typeof detail === 'string' ? detail : 'Upload failed.')
        }
    }

    return (
        <div className="w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl relative">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-[#F29F67]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-base leading-tight">Import Policy Document</h3>
                            <p className="text-xs text-slate-500 font-medium">NIST SP 800-53 Compliance Engine</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-5">
                <div className="relative" ref={dropdownRef}>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Analysis Domain</label>
                    <button
                        type="button"
                        onClick={() => status === 'idle' && setIsDomainOpen(!isDomainOpen)}
                        disabled={status !== 'idle'}
                        className={cn(
                            "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-left transition-all",
                            status === 'idle' ? "hover:bg-slate-100 cursor-pointer" : "opacity-60 cursor-not-allowed"
                        )}
                    >
                        {selectedDomainObj ? (
                            <div className="flex items-center gap-3">
                                <Layers className="w-4 h-4 text-[#F29F67]" />
                                <div>
                                    <p className="text-slate-900 font-bold text-sm">{selectedDomainObj.label}</p>
                                    <p className="text-slate-500 text-xs">{selectedDomainObj.description}</p>
                                </div>
                            </div>
                        ) : <span className="text-slate-500 font-medium text-sm">Select domain for targeted analysis...</span>}
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                    {isDomainOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                            {DOMAINS.map(d => (
                                <button key={d.value} onClick={() => { setSelectedDomain(d.value); setIsDomainOpen(false) }} className="w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors">
                                    <Layers className={cn("w-4 h-4 mt-0.5", selectedDomain === d.value ? "text-[#F29F67]" : "text-slate-400")} />
                                    <div>
                                        <p className={cn("text-sm font-bold", selectedDomain === d.value ? "text-[#F29F67]" : "text-slate-700")}>{d.label}</p>
                                        <p className="text-xs text-slate-500">{d.description}</p>
                                    </div>
                                </button>
                            ))}
                            <button onClick={() => { setSelectedDomain(''); setIsDomainOpen(false) }} className="w-full px-4 py-2 border-t border-slate-100 text-xs text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors font-medium">
                                Clear Selection
                            </button>
                        </div>
                    )}
                </div>

                <div
                    onDragOver={(e) => { e.preventDefault(); if (status === 'idle') setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (status === 'idle' && f) handleFile(f) }}
                    className={cn(
                        "relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden",
                        status === 'idle' ? (isDragging ? "border-[#F29F67] bg-orange-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50") : "border-slate-200 bg-slate-50"
                    )}
                >
                    {status === 'idle' && <label className="absolute inset-0 cursor-pointer z-10"><input type="file" accept="application/pdf" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} className="sr-only"/></label>}
                    
                    <div className="px-8 py-12 flex flex-col items-center justify-center min-h-[200px]">
                        {status === 'idle' && (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mx-auto text-slate-400"><UploadCloud className="w-7 h-7" /></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Click to upload or drag & drop</p>
                                    <p className="text-slate-500 text-xs mt-1">PDF documents only</p>
                                </div>
                            </div>
                        )}
                        {(status === 'uploading' || status === 'processing') && (
                            <div className="w-full max-w-sm space-y-5 text-center">
                                <div className="flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /><span className="text-slate-700 font-bold text-sm">Analyzing content...</span></div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <motion.div className="h-full bg-blue-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} />
                                </div>
                                <div className="text-xs text-slate-600 font-mono bg-white border border-slate-200 rounded-lg px-4 py-2.5 shadow-sm">{PROCESSING_LOGS[logIndex]}</div>
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="text-center space-y-3">
                                <CheckCircle2 className="w-14 h-14 text-teal-500 mx-auto" />
                                <h3 className="text-lg font-bold text-slate-900">Analysis Complete</h3>
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="text-center space-y-3">
                                <AlertCircle className="w-14 h-14 text-red-500 mx-auto" />
                                <h3 className="text-sm font-bold text-slate-900">Upload Failed</h3>
                                <p className="text-xs text-red-600">{errorMsg}</p>
                                <button onClick={() => setStatus('idle')} className="mt-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">Try Again</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
