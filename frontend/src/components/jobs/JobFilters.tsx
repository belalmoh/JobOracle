"use client"

import { useState } from "react"

export interface JobFiltersState {
  sources: string[]
  dateRange: string
  location: string
  minScore: number
}

interface JobFiltersProps {
  onFilterChange: (filters: JobFiltersState) => void
  jobSources: string[]
  viewMode: "reels" | "cards" | "table"
  onViewModeChange: (mode: "reels" | "cards" | "table") => void
}

const DEFAULT_SOURCES = ["LinkedIn", "Indeed", "ZipRecruiter", "Glassdoor", "Google Jobs"]

const DATE_OPTIONS = [
  { value: "", label: "Any time" },
  { value: "1", label: "Past 24 hours" },
  { value: "7", label: "Past week" },
  { value: "30", label: "Past month" },
]

export function JobFilters({ 
  onFilterChange, 
  jobSources, 
  viewMode, 
  onViewModeChange 
}: JobFiltersProps) {
  const [filters, setFilters] = useState<JobFiltersState>({
    sources: [],
    dateRange: "",
    location: "",
    minScore: 0,
  })

  const sources = jobSources.length > 0 ? jobSources : DEFAULT_SOURCES

  const handleSourceToggle = (source: string) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter(s => s !== source)
      : [...filters.sources, source]
    const newFilters = { ...filters, sources: newSources }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleDateChange = (dateRange: string) => {
    const newFilters = { ...filters, dateRange }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleLocationChange = (location: string) => {
    const newFilters = { ...filters, location }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleScoreChange = (minScore: number) => {
    const newFilters = { ...filters, minScore }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters = {
      sources: [],
      dateRange: "",
      location: "",
      minScore: 0,
    }
    setFilters(resetFilters)
    onFilterChange(resetFilters)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        <button
          onClick={handleReset}
          className="text-xs text-[oklch(0.55_0_0)] hover:text-[var(--accent)]"
        >
          Reset
        </button>
      </div>

      {/* View Mode */}
      <div>
        <label className="block text-sm font-medium mb-2">View Mode</label>
        <div className="flex gap-1 bg-[oklch(0.967_0.001_286.375)] p-1 rounded-lg">
          {(["reels", "cards", "table"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors ${
                viewMode === mode
                  ? "bg-white shadow-sm text-[oklch(0.15_0_0)]"
                  : "text-[oklch(0.55_0_0)] hover:text-[oklch(0.15_0_0)]"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Job Sources */}
      <div>
        <label className="block text-sm font-medium mb-2">Job Sources</label>
        <div className="space-y-2">
          {sources.map((source) => (
            <label key={source} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.sources.includes(source)}
                onChange={() => handleSourceToggle(source)}
                className="rounded border-gray-300 text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span className="text-sm">{source}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium mb-2">Date Posted</label>
        <select
          value={filters.dateRange}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
        >
          {DATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium mb-2">Location</label>
        <input
          type="text"
          value={filters.location}
          onChange={(e) => handleLocationChange(e.target.value)}
          placeholder="City, state, or remote"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
        />
      </div>

      {/* Minimum Score */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Min Match Score: {filters.minScore}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="10"
          value={filters.minScore}
          onChange={(e) => handleScoreChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
        />
        <div className="flex justify-between text-xs text-[oklch(0.55_0_0)] mt-1">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  )
}
