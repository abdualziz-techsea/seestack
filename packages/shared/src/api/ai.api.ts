import { apiClient } from './client'

export interface AiAnalysisResult {
  explanation: string
  rootCause: string
  fixSteps: string[]
  prevention: string[]
  severity: 'low' | 'medium' | 'high' | string
  confidence: 'low' | 'medium' | 'high' | string
  model: string
  configured: boolean
  cached: boolean
  generatedAt?: string | null
}

export const aiApi = {
  analyzeError: (fingerprint: string, projectId: string, force = false) =>
    apiClient.post<AiAnalysisResult>(
      `/api/v1/errors/${fingerprint}/ai-analysis`,
      null,
      { params: { projectId, force }, timeout: 60_000 }
    ),

  cached: (fingerprint: string, projectId: string) =>
    apiClient.get<AiAnalysisResult>(
      `/api/v1/errors/${fingerprint}/ai-analysis`,
      { params: { projectId } }
    ),

  status: () => apiClient.get<{ configured: boolean }>('/api/v1/errors/ai-analysis/status'),
}
