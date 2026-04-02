export interface DomainEntry {
  domain: string
  text: string | string[]
  related_nist_policies: string[]
}

export interface GapResult {
  domain: string
  status: 'processing' | 'completed' | 'failed'
  gaps?: string[]
}

export interface GapAnalysisCache {
  status: GapResult['status']
  results: GapResult[]
  message?: string
  updatedAt: number
}
