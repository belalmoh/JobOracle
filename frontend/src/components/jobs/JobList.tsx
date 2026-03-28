"use client"

import { useState, useEffect, useCallback } from "react"
import { Job, JobCard } from "./JobCard"

interface JobListProps {
  jobs: Job[]
  viewMode: "reels" | "cards" | "table"
  onJobClick: (job: Job) => void
  loading?: boolean
}

export function JobList({ jobs, viewMode, onJobClick, loading }: JobListProps) {
  const [currentReelIndex, setCurrentReelIndex] = useState(0)

  useEffect(() => {
    setCurrentReelIndex(0)
  }, [jobs.length])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (viewMode !== "reels") return
    
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault()
      setCurrentReelIndex((prev) => Math.min(prev + 1, jobs.length - 1))
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault()
      setCurrentReelIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === "Escape") {
      setCurrentReelIndex(0)
    }
  }, [viewMode, jobs.length])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[oklch(0.55_0_0)]">Loading jobs...</p>
        </div>
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 256 256" fill="currentColor" className="text-[oklch(0.85_0_0)] mb-4">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/>
        </svg>
        <p className="text-[oklch(0.55_0_0)]">No jobs found</p>
        <p className="text-sm text-[oklch(0.7_0_0)]">Try adjusting your filters or search terms</p>
      </div>
    )
  }

  // Reels mode - full screen cards
  if (viewMode === "reels") {
    return (
      <div className="relative">
        <div className="h-[500px]">
          <JobCard
            job={jobs[currentReelIndex]}
            viewMode="reels"
            onClick={() => onJobClick(jobs[currentReelIndex])}
          />
        </div>
        
        {/* Navigation controls */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentReelIndex((prev) => Math.max(prev - 1, 0))}
            disabled={currentReelIndex === 0}
            className="p-2 rounded-lg bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
              <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z"/>
            </svg>
          </button>
          
          <span className="text-sm text-[oklch(0.55_0_0)]">
            {currentReelIndex + 1} of {jobs.length}
          </span>
          
          <button
            onClick={() => setCurrentReelIndex((prev) => Math.min(prev + 1, jobs.length - 1))}
            disabled={currentReelIndex === jobs.length - 1}
            className="p-2 rounded-lg bg-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256" fill="currentColor">
              <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z"/>
            </svg>
          </button>
        </div>
        
        <p className="text-xs text-center text-[oklch(0.7_0_0)] mt-2">
          Use arrow keys to navigate, Esc to reset
        </p>
      </div>
    )
  }

  // Cards mode - grid layout
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            viewMode="cards"
            onClick={() => onJobClick(job)}
          />
        ))}
      </div>
    )
  }

  // Table mode
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wider">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wider">
                Posted
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[oklch(0.55_0_0)] uppercase tracking-wider">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map((job) => {
              const score = job.compatibility_score ?? 0
              const scoreColor = score >= 70 ? "bg-green-100 text-green-800" : score >= 40 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
              
              const formatDate = (dateStr?: string) => {
                if (!dateStr) return "-"
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

              return (
                <tr
                  key={job.id}
                  onClick={() => onJobClick(job)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-sm">{job.title}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[oklch(0.55_0_0)]">{job.company}</td>
                  <td className="px-4 py-3 text-sm text-[oklch(0.55_0_0)]">{job.location}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded bg-gray-100">
                      {job.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[oklch(0.55_0_0)]">
                    {formatDate(job.posted_date)}
                  </td>
                  <td className="px-4 py-3">
                    {score > 0 && (
                      <span className={`px-2 py-0.5 text-xs rounded font-medium ${scoreColor}`}>
                        {Math.round(score)}%
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
