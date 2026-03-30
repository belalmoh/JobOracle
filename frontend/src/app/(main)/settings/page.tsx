"use client"

import { useState, useEffect } from "react"
import { 
  Briefcase, 
  Bell, 
  Palette, 
  Search,
  Check,
  Loader2,
  Save
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTheme } from "next-themes"
import { api } from "@/lib/api"
import { toast } from "sonner"

const JOB_SOURCES = [
  { id: "linkedin", label: "LinkedIn", description: "Professional network jobs" },
  { id: "indeed", label: "Indeed", description: "Major job aggregator" },
  { id: "ziprecruiter", label: "ZipRecruiter", description: "Job search platform" },
  { id: "glassdoor", label: "Glassdoor", description: "Jobs with company reviews" },
  { id: "google_jobs", label: "Google Jobs", description: "Google's job search" },
]

interface SettingsData {
  job_sources: string[]
  default_keywords: string[]
  default_location: string
  notification_email: boolean
  notification_browser: boolean
  notification_frequency: string
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SettingsData>({
    job_sources: [],
    default_keywords: [],
    default_location: "",
    notification_email: false,
    notification_browser: false,
    notification_frequency: "instant",
  })
   const [keywordInput, setKeywordInput] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await api.settings.get()
      setSettings({
        job_sources: data.job_sources || [],
        default_keywords: data.default_keywords || [],
        default_location: data.default_location || "",
        notification_email: data.notification_email || false,
        notification_browser: data.notification_browser || false,
        notification_frequency: data.notification_frequency || "instant",
      })
    } catch (err) {
      console.error("Failed to load settings:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.settings.update(settings)
      toast.success("Settings saved successfully")
    } catch (err) {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleSourceToggle = (sourceId: string) => {
    setSettings(prev => ({
      ...prev,
      job_sources: prev.job_sources.includes(sourceId)
        ? prev.job_sources.filter(s => s !== sourceId)
        : [...prev.job_sources, sourceId]
    }))
  }

  const addKeyword = () => {
    if (!keywordInput.trim()) return
    if (!settings.default_keywords.includes(keywordInput.trim())) {
      setSettings(prev => ({
        ...prev,
        default_keywords: [...prev.default_keywords, keywordInput.trim()]
      }))
    }
    setKeywordInput("")
  }

  const removeKeyword = (keyword: string) => {
    setSettings(prev => ({
      ...prev,
      default_keywords: prev.default_keywords.filter(k => k !== keyword)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and configuration</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Job Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Job Sources
          </CardTitle>
          <CardDescription>
            Select which job platforms to search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {JOB_SOURCES.map(source => (
              <label
                key={source.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  settings.job_sources.includes(source.id)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted"
                }`}
              >
                <Checkbox
                  checked={settings.job_sources.includes(source.id)}
                  onCheckedChange={() => handleSourceToggle(source.id)}
                  className="mt-0.5"
                />
                <div>
                  <p className="font-medium">{source.label}</p>
                  <p className="text-sm text-muted-foreground">{source.description}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Defaults */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Defaults
          </CardTitle>
          <CardDescription>
            Default settings for job searches
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Default Location</label>
            <Input
              placeholder="e.g., Remote, New York, NY"
              value={settings.default_location}
              onChange={(e) => setSettings(prev => ({ ...prev, default_location: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Default Keywords</label>
            <div className="flex gap-2 mt-1">
              <Input
                placeholder="Add keyword..."
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              />
              <Button onClick={addKeyword}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {settings.default_keywords.map(keyword => (
                <Button
                  key={keyword}
                  variant="secondary"
                  size="sm"
                  className="gap-1"
                  onClick={() => removeKeyword(keyword)}
                >
                  {keyword}
                  <span className="ml-1">×</span>
                </Button>
              ))}
              {settings.default_keywords.length === 0 && (
                <p className="text-sm text-muted-foreground">No default keywords set</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you receive alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive emails for new matching jobs</p>
            </div>
            <Checkbox
              checked={settings.notification_email}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notification_email: checked === true }))}
            />
          </label>
          <label className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium">Browser Notifications</p>
              <p className="text-sm text-muted-foreground">Show desktop notifications</p>
            </div>
            <Checkbox
              checked={settings.notification_browser}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notification_browser: checked === true }))}
            />
          </label>
          <div>
            <label className="text-sm font-medium">Notification Frequency</label>
            <Select
              value={settings.notification_frequency}
              onValueChange={(value) => setSettings(prev => ({ ...prev, notification_frequency: value }))}
            >
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instant">Instant</SelectItem>
                <SelectItem value="daily">Daily digest</SelectItem>
                <SelectItem value="weekly">Weekly digest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium">Theme</label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
