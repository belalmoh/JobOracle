"use client"

import { useState, useEffect } from "react"
import { UploadDropzone } from "@/components/upload/UploadDropzone"
import { ParsedDataDisplay } from "@/components/resume/ParsedDataDisplay"
import { KeywordInput } from "@/components/keywords/KeywordInput"
import { SettingsWizard } from "@/components/settings/SettingsWizard"
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

  useEffect(() => {
    loadResumes()
    loadKeywords()
    checkSettings()
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
      
      await handleGenerateKeywords()
    } catch (err) {
      console.error("Parse failed:", err)
    }
  }

  const handleGenerateKeywords = async () => {
    try {
      await api.keywords.generate()
      loadKeywords()
    } catch (err) {
      console.error("Keyword generation failed:", err)
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
          </div>

          <div className="space-y-6">
            <section className="p-6 bg-white rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Your Resumes</h2>
              {resumes.length > 0 ? (
                <div className="space-y-2">
                  {resumes.map(resume => (
                    <button
                      key={resume.id}
                      onClick={() => selectResume(resume)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedResume?.id === resume.id
                          ? "bg-[var(--accent)]/10 border border-[var(--accent)]"
                          : "hover:bg-[oklch(0.967_0.001_286.375)]"
                      }`}
                    >
                      <p className="font-medium text-sm truncate">{resume.filename}</p>
                      <p className="text-xs text-[oklch(0.55_0_0)]">
                        {resume.file_type.toUpperCase()} • {resume.status}
                      </p>
                    </button>
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
      </div>
    </main>
  )
}