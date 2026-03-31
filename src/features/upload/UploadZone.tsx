'use client'

import { useState, useRef, DragEvent } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import {
    UploadCloud,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ChevronDown,
    ShieldCheck,
    X,
    FileText,
    Layers,
} from 'lucide-react'
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

const PROCESSING_LOGS = [
    'Extracting text from PDF...',
    'Chunking document content...',
    'Running semantic classification...',
    'Querying NIST SP 800-53 database...',
    'Mapping to control families...',
    'Finalizing analysis...',
]

export function UploadZone({ onSuccess }: UploadProps) {
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
            setStatus('error')
            setErrorMsg('Invalid file format. Please upload a PDF document.')
            return
        }
        if (f.size > 10 * 1024 * 1024) {
            setStatus('error')
            setErrorMsg('File exceeds 10MB limit. Please upload a smaller file.')
            return
        }
        setFile(f)
        upload(f)
    }

    const upload = async (f: File) => {
        setStatus('uploading')
        setProgress(0)
        setLogIndex(0)

        const formData = new FormData()
        formData.append('file', f)
        if (selectedDomain) {
            formData.append('domain', selectedDomain)
        }

        // Animate processing logs
        let logTimer: ReturnType<typeof setInterval>

        try {
            const uploadRes = await axios.post('http://localhost:5000/api/upload-pdf', formData, {
                onUploadProgress: (p) => {
                    const pct = Math.round((p.loaded * 100) / (p.total || 1))
                    setProgress(Math.min(pct, 30))
                }
            })

            setStatus('processing')
            setProgress(35)

            // Simulate processing log cycling
            let i = 0
            logTimer = setInterval(() => {
                i++
                setLogIndex(i)
                const newPct = Math.min(35 + i * 10, 92)
                setProgress(newPct)
                if (i >= PROCESSING_LOGS.length - 1) clearInterval(logTimer)
            }, 550)

            await new Promise(r => setTimeout(r, 3500))
            clearInterval(logTimer)

            setProgress(100)
            setStatus('success')
            setTimeout(() => onSuccess(uploadRes.data), 1000)

        } catch (err: any) {
            clearInterval(logTimer!)
            setStatus('error')
            const detail = err?.response?.data?.detail
            let msg = 'Upload or analysis failed. Please try again.'
            if (typeof detail === 'string') {
                try { msg = JSON.parse(detail).message ?? detail } catch { msg = detail }
            }
            setErrorMsg(msg)
        }
    }

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        const f = e.dataTransfer.files[0]
        if (f) handleFile(f)
    }

    const reset = () => {
        setFile(null)
        setStatus('idle')
        setProgress(0)
        setErrorMsg('')
        setLogIndex(0)
    }

    const isDisabled = status !== 'idle' && status !== 'error'

    return (
        <div className="w-full bg-[#0f0f1a] border border-white/8 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Ambient top glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#F29F67]/40 to-transparent" />

            {/* Header */}
            <div className="px-6 py-5 border-b border-white/6 bg-gradient-to-r from-[#0B0B18] to-[#111125]">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#F29F67]/10 border border-[#F29F67]/20 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-[#F29F67]" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base leading-tight">Import Policy Document</h3>
                            <p className="text-xs text-slate-500 mt-0.5">NIST SP 800-53 Compliance Engine</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#F29F67] bg-[#F29F67]/10 border border-[#F29F67]/25 px-3 py-1.5 rounded-full uppercase">
                        NIST SP 800-53
                    </span>
                </div>
            </div>

            <div className="p-6 space-y-5">

                {/* Domain Selector */}
                <div className="relative" ref={dropdownRef}>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Analysis Domain
                        <span className="ml-2 text-slate-600 font-normal capitalize normal-case tracking-normal">— optional</span>
                    </label>
                    <button
                        type="button"
                        onClick={() => !isDisabled && setIsDomainOpen(o => !o)}
                        disabled={isDisabled}
                        className={cn(
                            "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all duration-200",
                            "bg-[#151525] text-left",
                            isDomainOpen
                                ? "border-[#F29F67]/50 shadow-[0_0_0_3px_rgba(242,159,103,0.08)]"
                                : "border-white/8 hover:border-white/15",
                            isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        )}
                    >
                        {selectedDomainObj ? (
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Layers className="w-4 h-4 text-[#F29F67] shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-white font-medium truncate">{selectedDomainObj.label}</p>
                                    <p className="text-slate-500 text-xs truncate">{selectedDomainObj.description}</p>
                                </div>
                            </div>
                        ) : (
                            <span className="text-slate-500">Select domain for targeted analysis...</span>
                        )}
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            {selectedDomain && !isDisabled && (
                                <span
                                    role="button"
                                    onClick={(e) => { e.stopPropagation(); setSelectedDomain('') }}
                                    className="p-0.5 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </span>
                            )}
                            <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform duration-200", isDomainOpen && "rotate-180")} />
                        </div>
                    </button>

                    {/* Dropdown list */}
                    <AnimatePresence>
                        {isDomainOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute z-50 left-0 right-0 mt-2 bg-[#13132a] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                            >
                                {DOMAINS.map((domain) => (
                                    <button
                                        key={domain.value}
                                        type="button"
                                        onClick={() => { setSelectedDomain(domain.value); setIsDomainOpen(false) }}
                                        className={cn(
                                            "w-full flex items-start gap-3 px-4 py-3.5 text-left hover:bg-white/5 transition-colors",
                                            selectedDomain === domain.value && "bg-[#F29F67]/8 border-l-2 border-[#F29F67]"
                                        )}
                                    >
                                        <Layers className={cn("w-4 h-4 mt-0.5 shrink-0", selectedDomain === domain.value ? "text-[#F29F67]" : "text-slate-500")} />
                                        <div>
                                            <p className={cn("text-sm font-medium", selectedDomain === domain.value ? "text-[#F29F67]" : "text-white")}>
                                                {domain.label}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">{domain.description}</p>
                                        </div>
                                        {selectedDomain === domain.value && (
                                            <CheckCircle2 className="w-4 h-4 text-[#F29F67] ml-auto mt-0.5 shrink-0" />
                                        )}
                                    </button>
                                ))}
                                <div className="px-4 py-2.5 border-t border-white/6 bg-[#0f0f1f]">
                                    <p className="text-[10px] text-slate-600 leading-relaxed">
                                        💡 Skip selection for auto-domain classification across all 4 domains.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Upload Drop Zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); if (!isDisabled) setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={cn(
                        "relative rounded-xl border-2 border-dashed transition-all duration-300 overflow-hidden",
                        status === 'idle' && (isDragging
                            ? "border-[#F29F67] bg-[#F29F67]/8 shadow-[0_0_30px_rgba(242,159,103,0.15)]"
                            : "border-slate-700/70 hover:border-[#F29F67]/50 hover:bg-[#F29F67]/3"),
                        (status === 'uploading' || status === 'processing') && "border-[#3B8FF3]/40 bg-[#3B8FF3]/3",
                        status === 'success' && "border-[#34B1AA]/40 bg-[#34B1AA]/5",
                        status === 'error' && "border-[#ef4444]/40 bg-[#ef4444]/5",
                    )}
                >
                    {/* Clickable label overlay for idle/error */}
                    {(status === 'idle' || status === 'error') && (
                        <label className="absolute inset-0 cursor-pointer z-10">
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                className="sr-only"
                            />
                        </label>
                    )}

                    <div className="px-8 py-12 flex flex-col items-center justify-center min-h-[200px]">
                        <AnimatePresence mode="wait">

                            {/* IDLE */}
                            {status === 'idle' && (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="text-center space-y-4"
                                >
                                    <motion.div
                                        animate={{ y: isDragging ? -6 : 0 }}
                                        transition={{ type: 'spring', stiffness: 200 }}
                                        className={cn(
                                            "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto transition-colors",
                                            isDragging ? "bg-[#F29F67]/20 text-[#F29F67]" : "bg-[#1E1E2C] text-slate-400"
                                        )}
                                    >
                                        <UploadCloud className="w-7 h-7" />
                                    </motion.div>
                                    <div>
                                        <p className={cn("text-base font-semibold transition-colors", isDragging ? "text-[#F29F67]" : "text-white")}>
                                            {isDragging ? 'Drop your PDF here' : 'Click to upload or drag & drop'}
                                        </p>
                                        <p className="text-slate-500 text-sm mt-1">PDF documents only · max 10 MB</p>
                                    </div>
                                    {!selectedDomain && (
                                        <p className="text-xs text-slate-600 bg-white/3 border border-white/5 px-3 py-1.5 rounded-lg inline-block">
                                            No domain selected — auto-classification will run
                                        </p>
                                    )}
                                    {selectedDomain && (
                                        <p className="text-xs text-[#F29F67]/80 bg-[#F29F67]/8 border border-[#F29F67]/15 px-3 py-1.5 rounded-lg inline-block">
                                            Will analyze as: <span className="font-semibold">{selectedDomain}</span>
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {/* UPLOADING / PROCESSING */}
                            {(status === 'uploading' || status === 'processing') && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="w-full max-w-sm space-y-5 text-center"
                                >
                                    <div className="flex items-center justify-center gap-2.5">
                                        <Loader2 className="w-5 h-5 text-[#3B8FF3] animate-spin" />
                                        <span className="text-white font-semibold text-sm">
                                            {status === 'uploading' ? 'Uploading document...' : 'Analyzing content...'}
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="w-full bg-[#1E2A3A] h-1.5 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full bg-gradient-to-r from-[#3B8FF3] to-[#F29F67]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.4 }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono">{progress}%</p>

                                    {/* Animated log */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={logIndex}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            className="text-xs text-slate-400 font-mono bg-[#0B0B18] border border-white/6 rounded-lg px-4 py-2.5"
                                        >
                                            <span className="text-[#3B8FF3]">›</span> {PROCESSING_LOGS[Math.min(logIndex, PROCESSING_LOGS.length - 1)]}
                                        </motion.div>
                                    </AnimatePresence>

                                    {file && (
                                        <p className="text-xs text-slate-600 truncate max-w-xs mx-auto">
                                            <FileText className="inline w-3 h-3 mr-1" />
                                            {file.name}
                                        </p>
                                    )}
                                </motion.div>
                            )}

                            {/* SUCCESS */}
                            {status === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ scale: 0.85, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center space-y-3"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                                        className="w-16 h-16 rounded-2xl bg-[#34B1AA]/15 flex items-center justify-center mx-auto border border-[#34B1AA]/25"
                                    >
                                        <CheckCircle2 className="w-8 h-8 text-[#34B1AA]" />
                                    </motion.div>
                                    <h3 className="text-lg font-bold text-white">Analysis Complete</h3>
                                    <p className="text-slate-400 text-sm">Redirecting to results dashboard...</p>
                                </motion.div>
                            )}

                            {/* ERROR */}
                            {status === 'error' && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center space-y-4"
                                >
                                    <div className="w-14 h-14 rounded-2xl bg-[#ef4444]/10 flex items-center justify-center mx-auto border border-[#ef4444]/20">
                                        <AlertCircle className="w-7 h-7 text-[#ef4444]" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white mb-1">Upload Failed</h3>
                                        <p className="text-[#ef4444]/80 text-sm max-w-xs mx-auto leading-relaxed">{errorMsg}</p>
                                    </div>
                                    <button
                                        onClick={reset}
                                        className="px-5 py-2 bg-[#1E2A3A] hover:bg-[#253040] border border-white/8 hover:border-white/15 text-white text-sm font-medium rounded-lg transition-all"
                                    >
                                        Try Again
                                    </button>
                                </motion.div>
                            )}

                        </AnimatePresence>
                    </div>
                </div>

                {/* Footer info */}
                <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-slate-600">
                        Analysis runs entirely <span className="text-slate-500">offline</span> — no data is transmitted externally.
                    </p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#34B1AA] animate-pulse" />
                        <span className="text-[10px] text-slate-600 font-mono">Engine Ready</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
