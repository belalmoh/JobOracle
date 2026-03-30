"use client"

import { useState, useEffect, useCallback } from "react"
import { 
  Upload, 
  FileText, 
  Trash2, 
  Check, 
  X, 
  Plus,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { toast } from "sonner"

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

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
  const [parsedData, setParsedData] = useState<ParsedData | null>(null)
  const [extractedText, setExtractedText] = useState<string | null>(null)
  const [showSourceText, setShowSourceText] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    skills: true,
    experience: true,
    education: true,
  })

  useEffect(() => {
    loadResumes()
    loadKeywords()
  }, [])

  useEffect(() => {
    if (selectedResume) {
      loadResumeDetails(selectedResume.id)
    }
  }, [selectedResume])

  const loadResumes = async () => {
    try {
      const data = await api.upload.list()
      setResumes(data)
      if (data.length > 0 && !selectedResume) {
        setSelectedResume(data[0])
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

  const loadResumeDetails = async (resumeId: number) => {
    try {
      const data = await api.upload.get(resumeId)
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
      setSelectedResume(resume)
      toast.success("Resume uploaded successfully")
      
      // Auto extract and parse
      await api.extract.extract(resume.id)
      await api.parse.parse(resume.id)
      await loadResumeDetails(resume.id)
    } catch (err) {
      toast.error("Failed to upload resume")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteResume = async (resumeId: number) => {
    try {
      await api.upload.delete(resumeId)
      setResumes(prev => prev.filter(r => r.id !== resumeId))
      if (selectedResume?.id === resumeId) {
        setSelectedResume(resumes.length > 1 ? resumes[0] : null)
        setParsedData(null)
        setExtractedText(null)
      }
      toast.success("Resume deleted")
    } catch (err) {
      toast.error("Failed to delete resume")
    }
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return
    try {
      await api.keywords.create(newKeyword.trim())
      setKeywords(prev => [...prev, newKeyword.trim()])
      setNewKeyword("")
      toast.success("Keyword added")
    } catch (err) {
      toast.error("Failed to add keyword")
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
      toast.success("Keyword removed")
    } catch (err) {
      toast.error("Failed to remove keyword")
    }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      handleUpload(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Resumes</h1>
          <p className="text-muted-foreground">Manage your resumes and extracted data</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Upload & List */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Resume</CardTitle>
              <CardDescription>PDF or DOCX files supported</CardDescription>
            </CardHeader>
            <CardContent>
              <label
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {uploading ? "Uploading..." : "Click or drag to upload"}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </CardContent>
          </Card>

          {/* Resume List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Resumes</CardTitle>
            </CardHeader>
            <CardContent>
              {resumes.length > 0 ? (
                <div className="space-y-2">
                  {resumes.map(resume => (
                    <div
                      key={resume.id}
                      className={`relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedResume?.id === resume.id
                          ? "bg-primary/10 border border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedResume(resume)}
                    >
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{resume.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {resume.file_type.toUpperCase()} • {new Date(resume.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={resume.status === "parsed" ? "success" : "secondary"}>
                        {resume.status}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteResume(resume.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No resumes uploaded yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Keywords</CardTitle>
              <CardDescription>Search keywords for job matching</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add keyword..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddKeyword()}
                />
                <Button size="icon" onClick={handleAddKeyword}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1 pr-1">
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {keywords.length === 0 && (
                  <p className="text-sm text-muted-foreground">No keywords added</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Resume Details */}
        <div className="lg:col-span-2">
          {selectedResume ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedResume.filename}</CardTitle>
                  <CardDescription>
                    {selectedResume.file_type.toUpperCase()} • Uploaded {new Date(selectedResume.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSourceText(!showSourceText)}
                >
                  {showSourceText ? "View Parsed Data" : "View Source Text"}
                </Button>
              </CardHeader>
              <CardContent>
                {showSourceText ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {extractedText || "No text extracted"}
                    </pre>
                  </div>
                ) : parsedData ? (
                  <div className="space-y-4">
                    {/* Contact Info */}
                    {parsedData.contact && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Contact</h4>
                        <div className="grid gap-1 text-sm">
                          {parsedData.contact.name && <p>{parsedData.contact.name}</p>}
                          {parsedData.contact.email && <p className="text-muted-foreground">{parsedData.contact.email}</p>}
                          {parsedData.contact.phone && <p className="text-muted-foreground">{parsedData.contact.phone}</p>}
                          {parsedData.contact.location && <p className="text-muted-foreground">{parsedData.contact.location}</p>}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {parsedData.summary && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-medium mb-2">Summary</h4>
                        <p className="text-sm">{parsedData.summary}</p>
                      </div>
                    )}

                    {/* Skills */}
                    <div className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection("skills")}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-medium">Skills</span>
                        {expandedSections.skills ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      {expandedSections.skills && (
                        <div className="p-4 pt-0 border-t">
                          <div className="flex flex-wrap gap-2">
                            {parsedData.skills && typeof parsedData.skills === 'object' && !Array.isArray(parsedData.skills) ? (
                              Object.entries(parsedData.skills).map(([category, skills]) => 
                                skills && Array.isArray(skills) && skills.map((skill, idx) => (
                                  <Badge key={`${category}-${idx}`} variant="secondary">{skill}</Badge>
                                ))
                              )
                            ) : parsedData.skills && Array.isArray(parsedData.skills) ? (
                              parsedData.skills.map((skill, idx) => (
                                <Badge key={idx} variant="secondary">{skill}</Badge>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">No skills found</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Experience */}
                    <div className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection("experience")}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-medium">Experience</span>
                        {expandedSections.experience ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      {expandedSections.experience && (
                        <div className="p-4 pt-0 border-t">
                          {parsedData.experience?.length ? (
                            <div className="space-y-4">
                              {parsedData.experience.map((exp, idx) => (
                                <div key={idx}>
                                  <p className="font-medium">{exp.title}</p>
                                  <p className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</p>
                                  {exp.description && (
                                    <p className="text-sm mt-1">{exp.description}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No experience found</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Education */}
                    <div className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection("education")}
                        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-medium">Education</span>
                        {expandedSections.education ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                      </button>
                      {expandedSections.education && (
                        <div className="p-4 pt-0 border-t">
                          {parsedData.education?.length ? (
                            <div className="space-y-3">
                              {parsedData.education.map((edu, idx) => (
                                <div key={idx}>
                                  <p className="font-medium">{edu.degree}</p>
                                  <p className="text-sm text-muted-foreground">{edu.school} • {edu.year}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No education found</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Resume not parsed yet</p>
                    <Button 
                      className="mt-4"
                      onClick={async () => {
                        try {
                          await api.extract.extract(selectedResume.id)
                          await api.parse.parse(selectedResume.id)
                          await loadResumeDetails(selectedResume.id)
                          toast.success("Resume parsed successfully")
                        } catch (err) {
                          toast.error("Failed to parse resume")
                        }
                      }}
                    >
                      Parse Resume
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a resume to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
