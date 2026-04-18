// Backend API client

import { storage } from '~storage'
import type { JobData, AIProvider } from '~types'

class APIClient {
  private async getBaseURL(): Promise<string> {
    const settings = await storage.getSettings()
    return settings.backendUrl || 'http://localhost:8000/api'
  }

  private async fetch(endpoint: string, options?: RequestInit) {
    const baseURL = await this.getBaseURL()
    const response = await fetch(`${baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.detail || `API error: ${response.status}`)
    }

    return response.json()
  }

  // Connection check
  async checkConnection(): Promise<boolean> {
    try {
      await this.fetch('/settings')
      return true
    } catch {
      return false
    }
  }

  // Match score calculation
  async calculateMatchScore(jobData: JobData): Promise<number> {
    // First, create a job entry in the database
    const job = await this.fetch('/jobs', {
      method: 'POST',
      body: JSON.stringify({
        title: jobData.title,
        company: jobData.company,
        description: jobData.description,
        location: jobData.location,
        url: jobData.url,
        source: jobData.source,
      }),
    })

    // Calculate score
    const result = await this.fetch('/jobs/score', {
      method: 'POST',
      body: JSON.stringify({ job_id: job.id }),
    })

    return result.score
  }

  // Resume upload
  async uploadResume(file: File): Promise<{ id: number }> {
    const formData = new FormData()
    formData.append('file', file)

    const baseURL = await this.getBaseURL()
    const response = await fetch(`${baseURL}/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) throw new Error('Upload failed')
    return response.json()
  }

  // Parse resume
  async parseResume(resumeId: number): Promise<any> {
    return this.fetch('/parse', {
      method: 'POST',
      body: JSON.stringify({ resume_id: resumeId }),
    })
  }

  // Get user profile
  async getUserProfile(): Promise<any> {
    // Get latest resume and parsed data
    const resumes = await this.fetch('/resumes')
    if (!resumes.length) return null

    const latestResume = resumes[resumes.length - 1]
    const parsedData = await this.fetch(`/resumes/${latestResume.id}/parsed`)
    
    return {
      ...latestResume,
      parsedData,
    }
  }

  // Generate tailored resume
  async generateResume(jobData: JobData): Promise<string> {
    return this.fetch('/ai/generate-resume', {
      method: 'POST',
      body: JSON.stringify({
        job_title: jobData.title,
        company: jobData.company,
        job_description: jobData.description,
      }),
    })
  }

  // Generate cover letter
  async generateCoverLetter(jobData: JobData): Promise<string> {
    return this.fetch('/ai/generate-cover-letter', {
      method: 'POST',
      body: JSON.stringify({
        job_title: jobData.title,
        company: jobData.company,
        job_description: jobData.description,
      }),
    })
  }

  // Categorize field (for smart matching)
  async categorizeField(label: string): Promise<{ field: string; confidence: number }> {
    return this.fetch('/ai/categorize-field', {
      method: 'POST',
      body: JSON.stringify({ label }),
    })
  }
}

export const api = new APIClient()
