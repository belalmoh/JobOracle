"use client"

import { useState, useEffect } from "react"
import { UploadDropzone } from "@/components/upload/UploadDropzone"
import { ParsedDataDisplay } from "@/components/resume/ParsedDataDisplay"
import { KeywordInput } from "@/components/keywords/KeywordInput"
import { SettingsWizard } from "@/components/settings/SettingsWizard"
import { JobFilters, JobFiltersState } from "@/components/jobs/JobFilters"
import { JobList } from "@/components/jobs/JobList"
import { JobDetailModal } from "@/components/jobs/JobDetailModal"
import { Job } from "@/components/jobs/JobCard"
import { api } from "@/lib/api"

interface Resume {
  id: number
  filename: string
  file_type: string
  status: string
  created_at: string
}

interface ParsedData {
  contact?: { name?: string; email?: string; phone?: string; location?: string }
  summary?: string
  skills?: string[]
  experience?: { title?: string; company?: string; duration?: string; description?: string }[]
  education?: { degree?: string; school?: string; year?: string }[]
}

export default function Home() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [keywords, setKeywords] = useState<string[]>([])
  const [showSourceText, setShowSourceText] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(true)
  
  // Job search state
  const [jobs, setJobs] = useState<Job[]>([])
  const [viewMode, setViewMode] = useState<"reels" | "cards" | "table">("cards")
  const [filters, setFilters] = useState<JobFiltersState>({
    sources: [],
    dateRange: "",
    location: "",
    minScore: 0,
  })
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [searchKeywords, setSearchKeywords] = useState("")
  const [searchLocation, setSearchLocation] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [jobSources, setJobSources] = useState<string[]>([])

  useEffect(() => {
    loadResumes()
    loadKeywords()
    checkSettings()
    loadJobSources()
  }, [])

  const checkSettings = async () => {
    try {
      const settings = await api.settings.get()
      if (!settings.job_sources?.length && !settings.default_keywords?.length) {
        setShowSetupWizard(true)
      } else {
        setShowSetupWizard(false)
      }
    } catch {
      setShowSetupWizard(true)
    }
  }

  const loadResumes = async () => {
    try {
      const data = await api.upload.list()
      setResumes(data)
      if (data.length > 0 && !selectedResume) {
        selectResume(data[0])
      }
    } catch (err) {
      console.error("Failed to load resumes:", err)
    }
  }

  const loadKeywords = async () => {
    try {
      const data = await api.keywords.list()
      setKeywords(data.map((k: { keyword: string }) => k.keyword))
    } catch (err) {
      console.error("Failed to load keywords:", err)
    }
  }

  const loadJobSources = async () => {
    try {
      const settings = await api.settings.get()
      setJobSources(settings.job_sources || [])
    } catch (err) {
      console.error("Failed to load job sources:", err)
    }
  }

  const handleSearch = async () => {
    setIsSearching(true)
    try {
      const results = await api.jobs.search(searchKeywords, searchLocation, filters.sources)
      setJobs(results)
      // Auto-score after search
      if (results.length > 0) {
        try {
          await api.jobs.scoreAll(results.map((j: Job) => j.id))
          const scored = await api.jobs.list()
          setJobs(scored)
        } catch (scoreErr) {
          console.error("Failed to score jobs:", scoreErr)
        }
      }
    } catch (err) {
      console.error("Search failed:", err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleFilterChange = async (newFilters: JobFiltersState) => {
    setFilters(newFilters)
    try {
      const params: {
        source?: string
        location?: string
        date_from?: string
        sort?: string
        min_score?: number
      } = {}
      
      if (newFilters.sources.length > 0) {
        params.source = newFilters.sources.join(",")
      }
      if (newFilters.location) {
        params.location = newFilters.location
      }
      if (newFilters.dateRange) {
        params.date_from = newFilters.dateRange
      }
      if (newFilters.minScore > 0) {
        params.min_score = newFilters.minScore
      }
      
      const results = await api.jobs.list(params)
      setJobs(results)
    } catch (err) {
      console.error("Filter failed:", err)
    }
  }

  const selectResume = async (resume: Resume) => {
    setSelectedResume(resume)
    setShowSourceText(false)
    setUploadSuccess(false)
    setUploadError(null)
    
    try {
      const data = await api.upload.get(resume.id)
      if (data.extracted_text) {
        setExtractedText(data.extracted_text)
      }
      if (data.parsed_data) {
        setParsedData(data.parsed_data)
      }
    } catch (err) {
      console.error("Failed to load resume details:", err)
    }
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    
    try {
      const result = await api.upload.upload(file)
      const resume: Resume = {
        id: result.id,
        filename: result.filename,
        file_type: result.file_type,
        status: result.status,
        created_at: new Date().toISOString(),
      }
      
      setResumes(prev => [resume, ...prev])
      selectResume(resume)
      setUploadSuccess(true)
      
      await handleExtract(resume.id)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleExtract = async (resumeId: number) => {
    try {
      const result = await api.extract.extract(resumeId)
      setExtractedText(result.extracted_text)
      
      await handleParse(resumeId)
    } catch (err) {
      console.error("Extraction failed:", err)
    }
  }

  const handleParse = async (resumeId: number) => {
    try {
      const result = await api.parse.parse(resumeId)
      setParsedData(result.parsed_data)
    } catch (err) {
      console.error("Parse failed:", err)
    }
  }

  const handleAddKeyword = async (keyword: string) => {
    try {
      await api.keywords.create(keyword)
      setKeywords(prev => [...prev, keyword])
    } catch (err) {
      console.error("Failed to add keyword:", err)
    }
  }

  const handleRemoveKeyword = async (keyword: string) => {
    try {
      const data = await api.keywords.list()
      const kw = data.find((k: { keyword: string }) => k.keyword === keyword)
      if (kw) {
        await api.keywords.delete(kw.id)
      }
      setKeywords(prev => prev.filter(k => k !== keyword))
    } catch (err) {
      console.error("Failed to remove keyword:", err)
    }
  }

  const handleSaveSettings = async (settings: object) => {
    try {
      await api.settings.update(settings)
      setShowSetupWizard(false)
      setShowSettings(false)
    } catch (err) {
      console.error("Failed to save settings:", err)
    }
  }

  const handleDeleteResume = async (resumeId: number) => {
    try {
      const result = await api.upload.delete(resumeId)
      setResumes(prev => prev.filter(r => r.id !== resumeId))
      if (selectedResume?.id === resumeId) {
        setSelectedResume(null)
        setExtractedText(null)
        setParsedData(null)
      }
      if (result.cleared_user_data) {
        setKeywords([])
      }
    } catch (err) {
      console.error("Failed to delete resume:", err)
    }
  }

  if (showSetupWizard) {
    return (
      <main className="min-h-screen p-8 bg-[oklch(1_0_0)]">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6">Welcome to JobOracle</h1>
          <p className="text-[oklch(0.55_0_0)] mb-8">
            Let&apos;s set up your job search preferences
          </p>
          <SettingsWizard onSave={handleSaveSettings} />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-[oklch(1_0_0)]">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold">JobOracle</h1>
            <p className="text-[oklch(0.55_0_0)]">Find and apply to your next job</p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 text-sm border border-[oklch(0.967_0.001_286.375)] rounded-lg hover:bg-[oklch(0.967_0.001_286.375)]"
          >
            Settings
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <section className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Upload Resume</h2>
              <UploadDropzone
                onUpload={handleUpload}
                uploading={uploading}
                error={uploadError}
                success={uploadSuccess}
              />
            </section>

            {selectedResume && (
              <section className="p-6 bg-white rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Resume Data</h2>
                <ParsedDataDisplay
                  parsedData={parsedData}
                  extractedText={extractedText}
                  showSourceText={showSourceText}
                  onToggleView={() => setShowSourceText(!showSourceText)}
                  onRemoveSkill={handleRemoveKeyword}
                />
              </section>
            )}

            <section className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Keywords</h2>
              <KeywordInput
                keywords={keywords}
                onAdd={handleAddKeyword}
                onRemove={handleRemoveKeyword}
              />
            </section>

            {/* Job Search Section */}
            <section className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Job Search</h2>
              
              {/* Search Bar */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Job title or keywords"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                />
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Location"
                  className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>

              {/* Job List */}
              <JobList
                jobs={jobs}
                viewMode={viewMode}
                onJobClick={setSelectedJob}
                loading={isSearching}
              />
            </section>
          </div>

          <div className="space-y-6">
            {/* Job Filters Sidebar */}
            <JobFilters
              onFilterChange={handleFilterChange}
              jobSources={jobSources}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            <section className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Your Resumes</h2>
              {resumes.length > 0 ? (
                <div className="space-y-2">
                  {resumes.map(resume => (
                    <div
                      key={resume.id}
                      className={`w-full text-left p-3 rounded-lg transition-colors group relative ${
                        selectedResume?.id === resume.id
                          ? "bg-[var(--accent)]/10 border border-[var(--accent)]"
                          : "hover:bg-[oklch(0.967_0.001_286.375)]"
                      }`}
                    >
                      <button
                        onClick={() => selectResume(resume)}
                        className="w-full"
                      >
                        <p className="font-medium text-sm truncate">{resume.filename}</p>
                        <p className="text-xs text-[oklch(0.55_0_0)]">
                          {resume.file_type.toUpperCase()} • {resume.status}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteResume(resume.id)
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[oklch(0.55_0_0)] hover:text-[var(--destructive)] transition-opacity"
                        title="Delete resume"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[oklch(0.55_0_0)]">No resumes uploaded yet</p>
              )}
            </section>
          </div>
        </div>

        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-[oklch(0.55_0_0)] hover:text-[oklch(0.15_0_0)]"
                >
                  ✕
                </button>
              </div>
              <SettingsWizard onSave={handleSaveSettings} />
            </div>
          </div>
        )}

        <JobDetailModal
          job={selectedJob}
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      </div>
    </main>
  )
}