"use client"

import { useState } from "react"

export interface Job {
  id: number
  title: string
  company: string
  location: string
  description?: string
  requirements?: string
  apply_url?: string
  source: string
  posted_date?: string
  salary?: string
  compatibility_score?: number
  match_keywords?: string[]
  is_duplicate: boolean
  status: string
  created_at: string
}

interface JobCardProps {
  job: Job
  viewMode: "reels" | "cards" | "table"
  onClick: () => void
}

export function JobCard({ job, viewMode, onClick }: JobCardProps) {
  const score = job.compatibility_score ?? 0
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-500"
    if (score >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getScoreTextColor = (score: number) => {
    if (score >= 70) return "text-green-700"
    if (score >= 40) return "text-yellow-700"
    return "text-red-700"
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString()
  }

  const sourceBadgeColors: Record<string, string> = {
    linkedin: "bg-blue-100 text-blue-800",
    indeed: "bg-red-100 text-red-800",
    ziprecruiter: "bg-purple-100 text-purple-800",
    glassdoor: "bg-green-100 text-green-800",
    google: "bg-gray-100 text-gray-800",
  }

  if (viewMode === "reels") {
    return (
      <div 
        onClick={onClick}
        className="h-full cursor-pointer bg-white rounded-lg shadow-md p-6 overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-1">{job.title}</h3>
            <p className="text-[oklch(0.55_0_0)]">{job.company}</p>
          </div>
          {score > 0 && (
            <div className={`flex items-center gap-2 ${getScoreTextColor(score)}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(score)}`}>
                {Math.round(score)}
              </div>
              <span className="text-xs font-medium">Match</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mb-4 text-sm text-[oklch(0.55_0_0)]">
          <span className="flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
              <path d="M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z"/>
            </svg>
            {job.location}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${sourceBadgeColors[job.source.toLowerCase()] || "bg-gray-100 text-gray-800"}`}>
            {job.source}
          </span>
          {job.posted_date && (
            <span>{formatDate(job.posted_date)}</span>
          )}
        </div>

        {job.salary && (
          <p className="text-sm font-medium text-green-700 mb-4">{job.salary}</p>
        )}

        {job.description && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-[oklch(0.55_0_0)] whitespace-pre-wrap line-clamp-none">
              {job.description}
            </p>
          </div>
        )}

        {job.match_keywords && job.match_keywords.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {job.match_keywords.map((keyword, idx) => (
              <span key={idx} className="px-2 py-1 bg-[var(--accent)]/10 text-[var(--accent)] text-xs rounded">
                {keyword}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Cards mode (compact)
  return (
    <div 
      onClick={onClick}
      className="cursor-pointer bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{job.title}</h3>
          <p className="text-xs text-[oklch(0.55_0_0)] truncate">{job.company}</p>
        </div>
        {score > 0 && (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getScoreColor(score)}`}>
            {Math.round(score)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-[oklch(0.55_0_0)] mb-3">
        <span className="truncate">{job.location}</span>
        <span>•</span>
        <span className={`px-1.5 py-0.5 rounded ${sourceBadgeColors[job.source.toLowerCase()] || "bg-gray-100 text-gray-800"}`}>
          {job.source}
        </span>
        {job.posted_date && (
          <>
            <span>•</span>
            <span>{formatDate(job.posted_date)}</span>
          </>
        )}
      </div>

      {job.match_keywords && job.match_keywords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {job.match_keywords.slice(0, 3).map((keyword, idx) => (
            <span key={idx} className="px-1.5 py-0.5 bg-[var(--accent)]/10 text-[var(--accent)] text-xs rounded">
              {keyword}
            </span>
          ))}
          {job.match_keywords.length > 3 && (
            <span className="text-xs text-[oklch(0.55_0_0)]">+{job.match_keywords.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}
