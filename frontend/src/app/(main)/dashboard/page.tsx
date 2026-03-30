"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Briefcase, 
  FileText, 
  TrendingUp, 
  Target, 
  Plus, 
  ArrowRight,
  Sparkles,
  Lightbulb,
  AlertCircle,
  Upload
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"

interface Stats {
  totalJobs: number
  applications: number
  interviews: number
  avgScore: number
}

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
  skills?: string[] | { [category: string]: string[] }
  experience?: { title?: string; company?: string; duration?: string; description?: string }[]
  education?: { degree?: string; school?: string; year?: string }[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalJobs: 0,
    applications: 0,
    interviews: 0,
    avgScore: 0,
  })
  const [resume, setResume] = useState<Resume | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load resumes
      const resumes = await api.upload.list()
      if (resumes.length > 0) {
        setResume(resumes[0])
        const resumeData = await api.upload.get(resumes[0].id)
        if (resumeData.parsed_data) {
          setParsedData(resumeData.parsed_data)
        }
      }

      // Load jobs
      const jobs = await api.jobs.list()
      setStats(prev => ({ ...prev, totalJobs: jobs.length }))

      // Calculate average score
      if (jobs.length > 0) {
        const scoredJobs = jobs.filter((j: { compatibility_score?: number }) => j.compatibility_score != null)
        if (scoredJobs.length > 0) {
          const avgScore = scoredJobs.reduce((sum: number, j: { compatibility_score: number }) => sum + j.compatibility_score, 0) / scoredJobs.length
          setStats(prev => ({ ...prev, avgScore: Math.round(avgScore) }))
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Jobs Found",
      value: stats.totalJobs,
      icon: Briefcase,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Applications",
      value: stats.applications,
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Interviews",
      value: stats.interviews,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Avg. Match",
      value: `${stats.avgScore}%`,
      icon: Target,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ]

  const getAtsScore = () => {
    if (!parsedData?.skills) return 0
    let score = 0
    if (parsedData.skills && Array.isArray(parsedData.skills)) {
      score += Math.min(parsedData.skills.length * 5, 30)
    }
    if (parsedData.experience?.length) {
      score += Math.min(parsedData.experience.length * 15, 30)
    }
    if (parsedData.education?.length) {
      score += 20
    }
    if (parsedData.summary) {
      score += 20
    }
    return Math.min(score, 100)
  }

  const getStrengths = () => {
    const strengths: string[] = []
    if (parsedData?.skills && Array.isArray(parsedData.skills) && parsedData.skills.length > 5) {
      strengths.push("Strong skill set")
    }
    if (parsedData?.experience?.length && parsedData.experience.length >= 2) {
      strengths.push("Solid experience")
    }
    if (parsedData?.education?.length) {
      strengths.push("Education verified")
    }
    if (parsedData?.summary) {
      strengths.push("Professional summary")
    }
    return strengths
  }

  const getWeaknesses = () => {
    const weaknesses: string[] = []
    if (!parsedData?.skills || (Array.isArray(parsedData.skills) && parsedData.skills.length < 3)) {
      weaknesses.push("Limited skills listed")
    }
    if (!parsedData?.experience?.length) {
      weaknesses.push("No experience data")
    }
    if (!parsedData?.education?.length) {
      weaknesses.push("No education data")
    }
    if (!parsedData?.summary) {
      weaknesses.push("Missing summary")
    }
    return weaknesses
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your job search progress</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Resume Overview Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Resume Overview</CardTitle>
              <CardDescription>Your active resume analysis</CardDescription>
            </div>
            <Link href="/resumes">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {resume ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{resume.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {resume.file_type.toUpperCase()} • {new Date(resume.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* ATS Score */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="relative h-16 w-16">
                    <svg className="h-16 w-16 -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${getAtsScore() * 1.76} 176`}
                        className="text-primary transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
                      {getAtsScore()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">ATS Score</p>
                    <p className="text-sm text-muted-foreground">
                      {getAtsScore() >= 70 ? "Strong" : getAtsScore() >= 50 ? "Average" : "Needs improvement"}
                    </p>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-green-600" />
                      <p className="font-medium text-green-800 dark:text-green-200">Strengths</p>
                    </div>
                    <ul className="space-y-1">
                      {getStrengths().length > 0 ? (
                        getStrengths().map((s, i) => (
                          <li key={i} className="text-sm text-green-700 dark:text-green-300">• {s}</li>
                        ))
                      ) : (
                        <li className="text-sm text-green-700 dark:text-green-300">No strengths detected yet</li>
                      )}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/50">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">Areas to Improve</p>
                    </div>
                    <ul className="space-y-1">
                      {getWeaknesses().length > 0 ? (
                        getWeaknesses().map((w, i) => (
                          <li key={i} className="text-sm text-yellow-700 dark:text-yellow-300">• {w}</li>
                        ))
                      ) : (
                        <li className="text-sm text-yellow-700 dark:text-yellow-300">Looking good!</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Skills Preview */}
                {parsedData?.skills && Array.isArray(parsedData.skills) && parsedData.skills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Top Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedData.skills.slice(0, 8).map((skill, i) => (
                        <Badge key={i} variant="secondary">{skill}</Badge>
                      ))}
                      {parsedData.skills.length > 8 && (
                        <Badge variant="outline">+{parsedData.skills.length - 8} more</Badge>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">No resume uploaded yet</p>
                <Link href="/resumes">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Resume
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common tasks to speed up your search</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/jobs" className="block">
              <Button variant="outline" className="w-full justify-start h-12">
                <Briefcase className="mr-3 h-5 w-5" />
                <span>Search for Jobs</span>
                <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </Link>
            <Link href="/resumes" className="block">
              <Button variant="outline" className="w-full justify-start h-12">
                <FileText className="mr-3 h-5 w-5" />
                <span>Manage Resume</span>
                <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </Link>
            <Link href="/applications" className="block">
              <Button variant="outline" className="w-full justify-start h-12">
                <TrendingUp className="mr-3 h-5 w-5" />
                <span>Track Applications</span>
                <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
              </Button>
            </Link>
            <Button variant="outline" className="w-full justify-start h-12" disabled>
              <Sparkles className="mr-3 h-5 w-5" />
              <span>Generate Cover Letter</span>
              <Badge variant="secondary" className="ml-auto">Coming Soon</Badge>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
