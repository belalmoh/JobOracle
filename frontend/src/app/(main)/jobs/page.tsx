"use client"

import { useState, useEffect } from "react"
import { 
  Search, 
  MapPin, 
  ExternalLink, 
  Filter,
  LayoutGrid,
  List,
  Loader2,
  X,
  ChevronDown,
  Copy,
  Check
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { toast } from "sonner"

interface Job {
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

interface JobFilters {
  sources: string[]
  dateRange: string
  location: string
  minScore: number
}

const sourceColors: Record<string, string> = {
  linkedin: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  indeed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  ziprecruiter: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  glassdoor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  google: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [searchKeywords, setSearchKeywords] = useState("")
  const [searchLocation, setSearchLocation] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")
  const [showFilters, setShowFilters] = useState(true)
  const [jobSources, setJobSources] = useState<string[]>([])
  const [filters, setFilters] = useState<JobFilters>({
    sources: [],
    dateRange: "",
    location: "",
    minScore: 0,
  })
  const [copiedResume, setCopiedResume] = useState(false)

  useEffect(() => {
    loadJobSources()
    loadJobs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, jobs])

  const loadJobSources = async () => {
    try {
      const settings = await api.settings.get()
      setJobSources(settings.job_sources || [])
    } catch (err) {
      console.error("Failed to load job sources:", err)
    }
  }

  const loadJobs = async () => {
    try {
      const data = await api.jobs.list()
      setJobs(data)
      setFilteredJobs(data)
    } catch (err) {
      console.error("Failed to load jobs:", err)
    }
  }

  const handleSearch = async () => {
    setIsSearching(true)
    try {
      const results = await api.jobs.search(searchKeywords, searchLocation, filters.sources)
      setJobs(results)
      
      if (results.length > 0) {
        await api.jobs.scoreAll(results.map((j: Job) => j.id))
        const scored = await api.jobs.list()
        setJobs(scored)
      }
      toast.success(`Found ${results.length} jobs`)
    } catch (err) {
      toast.error("Search failed")
    } finally {
      setIsSearching(false)
    }
  }

  const applyFilters = () => {
    let result = [...jobs]
    
    if (filters.sources.length > 0) {
      result = result.filter(job => filters.sources.includes(job.source.toLowerCase()))
    }
    
    if (filters.location) {
      result = result.filter(job => 
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      )
    }
    
    if (filters.dateRange) {
      const now = new Date()
      const cutoff = new Date()
      if (filters.dateRange === "today") {
        cutoff.setHours(0, 0, 0, 0)
      } else if (filters.dateRange === "week") {
        cutoff.setDate(now.getDate() - 7)
      } else if (filters.dateRange === "month") {
        cutoff.setDate(now.getDate() - 30)
      }
      result = result.filter(job => new Date(job.created_at) >= cutoff)
    }
    
    if (filters.minScore > 0) {
      result = result.filter(job => (job.compatibility_score || 0) >= filters.minScore)
    }
    
    setFilteredJobs(result)
  }

  const handleSourceToggle = (source: string) => {
    setFilters(prev => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source]
    }))
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

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-green-500"
    if (score >= 40) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getScoreTextColor = (score: number) => {
    if (score >= 70) return "text-green-700 dark:text-green-400"
    if (score >= 40) return "text-yellow-700 dark:text-yellow-400"
    return "text-red-700 dark:text-red-400"
  }

  const copyResumeText = async () => {
    try {
      const resumes = await api.upload.list()
      if (resumes.length > 0) {
        const data = await api.upload.get(resumes[0].id)
        if (data.extracted_text) {
          await navigator.clipboard.writeText(data.extracted_text)
          setCopiedResume(true)
          toast.success("Resume copied to clipboard")
          setTimeout(() => setCopiedResume(false), 2000)
        }
      }
    } catch (err) {
      toast.error("Failed to copy resume")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-muted-foreground">Search and browse job listings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "cards" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("cards")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-base">Filters</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sources */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Sources</h4>
                  <div className="space-y-2">
                    {jobSources.length > 0 ? jobSources.map(source => (
                      <label key={source} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={filters.sources.includes(source)}
                          onCheckedChange={() => handleSourceToggle(source)}
                        />
                        <span className="text-sm capitalize">{source}</span>
                      </label>
                    )) : (
                      <p className="text-sm text-muted-foreground">No sources configured</p>
                    )}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Date Posted</h4>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Past week</SelectItem>
                      <SelectItem value="month">Past month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Location</h4>
                  <Input
                    placeholder="Filter by location..."
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                {/* Min Score */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Min Match Score</h4>
                  <Select
                    value={filters.minScore.toString()}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, minScore: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any</SelectItem>
                      <SelectItem value="40">40%+</SelectItem>
                      <SelectItem value="60">60%+</SelectItem>
                      <SelectItem value="80">80%+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setFilters({ sources: [], dateRange: "", location: "", minScore: 0 })}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
          {/* Search Bar */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-2">
                {!showFilters && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowFilters(true)}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                )}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Job title or keywords..."
                    value={searchKeywords}
                    onChange={(e) => setSearchKeywords(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-9"
                  />
                </div>
                <div className="relative w-40">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Location..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-9"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Search"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {/* Jobs List */}
          {filteredJobs.length > 0 ? (
            <div className={viewMode === "cards" ? "grid gap-4 md:grid-cols-2" : "space-y-3"}>
              {filteredJobs.map(job => (
                <Card
                  key={job.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedJob?.id === job.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedJob(job)}
                >
                  <CardContent className={viewMode === "cards" ? "p-4" : "p-4 flex items-center gap-4"}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold truncate">{job.title}</h3>
                        {job.compatibility_score != null && job.compatibility_score > 0 && (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${getScoreColor(job.compatibility_score)}`}>
                            {Math.round(job.compatibility_score)}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{job.company}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{job.location}</span>
                        <span>•</span>
                        <span className={`px-2 py-0.5 rounded ${sourceColors[job.source.toLowerCase()] || "bg-gray-100 text-gray-800"}`}>
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
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.match_keywords.slice(0, 3).map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                          {job.match_keywords.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.match_keywords.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No jobs found</p>
                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Job Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedJob(null)} />
          <div className="relative bg-background rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-background">
              <div>
                <h2 className="text-xl font-semibold">{selectedJob.title}</h2>
                <p className="text-muted-foreground">{selectedJob.company}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedJob(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6">
              {/* Meta Info */}
              <div className="flex items-center gap-4 flex-wrap">
                {selectedJob.compatibility_score != null && selectedJob.compatibility_score > 0 && (
                  <div className={`flex items-center gap-2 ${getScoreTextColor(selectedJob.compatibility_score)}`}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(selectedJob.compatibility_score)}`}>
                      {Math.round(selectedJob.compatibility_score)}
                    </div>
                    <span className="text-sm font-medium">Match</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedJob.location}</span>
                </div>
                <Badge className={sourceColors[selectedJob.source.toLowerCase()] || ""}>
                  {selectedJob.source}
                </Badge>
                {selectedJob.salary && (
                  <Badge variant="outline">{selectedJob.salary}</Badge>
                )}
              </div>

              {/* Match Keywords */}
              {selectedJob.match_keywords && selectedJob.match_keywords.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Matched Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.match_keywords.map((keyword, idx) => (
                      <Badge key={idx} variant="secondary">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedJob.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-sm">{selectedJob.description}</p>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {selectedJob.requirements && (
                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="whitespace-pre-wrap text-sm">{selectedJob.requirements}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 flex items-center justify-between gap-2 p-4 border-t bg-background">
              <Button variant="outline" onClick={copyResumeText}>
                {copiedResume ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                Copy Resume
              </Button>
              {selectedJob.apply_url && (
                <Button asChild>
                  <a href={selectedJob.apply_url} target="_blank" rel="noopener noreferrer">
                    Apply Now
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
