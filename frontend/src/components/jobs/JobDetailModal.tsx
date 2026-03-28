"use client"

import { Job } from "./JobCard"

interface JobDetailModalProps {
  job: Job | null
  isOpen: boolean
  onClose: () => void
}

export function JobDetailModal({ job, isOpen, onClose }: JobDetailModalProps) {
  if (!isOpen || !job) return null

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
    if (!dateStr) return "Unknown"
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleApply = () => {
    if (job.apply_url) {
      window.open(job.apply_url, "_blank", "noopener,noreferrer")
    }
  }

  const sourceBadgeColors: Record<string, string> = {
    linkedin: "bg-blue-100 text-blue-800",
    indeed: "bg-red-100 text-red-800",
    ziprecruiter: "bg-purple-100 text-purple-800",
    glassdoor: "bg-green-100 text-green-800",
    google: "bg-gray-100 text-gray-800",
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold mb-1">{job.title}</h2>
            <p className="text-[oklch(0.55_0_0)]">{job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[oklch(0.55_0_0)] hover:text-[oklch(0.15_0_0)] p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" fill="currentColor">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Score & Meta */}
          <div className="flex items-center gap-4 mb-6">
            {score > 0 && (
              <div className={`flex items-center gap-2 ${getScoreTextColor(score)}`}>
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(score)}`}>
                  {Math.round(score)}
                </div>
                <div>
                  <p className="font-medium">Match Score</p>
                  <p className="text-xs">compatibility</p>
                </div>
              </div>
            )}
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-3 text-sm text-[oklch(0.55_0_0)]">
              <span className={`px-2 py-1 rounded ${sourceBadgeColors[job.source.toLowerCase()] || "bg-gray-100 text-gray-800"}`}>
                {job.source}
              </span>
              {job.posted_date && (
                <span>Posted {formatDate(job.posted_date)}</span>
              )}
            </div>
          </div>

          {/* Location & Salary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-[oklch(0.55_0_0)] mb-1">Location</p>
              <p className="font-medium">{job.location || "Not specified"}</p>
            </div>
            {job.salary && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-[oklch(0.55_0_0)] mb-1">Salary</p>
                <p className="font-medium text-green-700">{job.salary}</p>
              </div>
            )}
          </div>

          {/* Matched Keywords */}
          {job.match_keywords && job.match_keywords.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Matched Keywords</p>
              <div className="flex flex-wrap gap-2">
                {job.match_keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] text-sm rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <div className="p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-2">Requirements</h3>
              <div className="p-4 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{job.requirements}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          {job.apply_url && (
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
            >
              Apply Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
