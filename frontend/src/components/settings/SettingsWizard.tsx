import { useState } from "react"
import { CaretRight, CaretLeft, Check } from "@phosphor-icons/react"

interface SettingsData {
  job_sources: string[]
  default_keywords: string[]
  default_location: string
  notification_email: boolean
  notification_browser: boolean
  notification_frequency: string
}

interface SettingsWizardProps {
  onSave: (settings: SettingsData) => void
}

const JOB_SOURCES = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "indeed", label: "Indeed" },
  { id: "ziprecruiter", label: "ZipRecruiter" },
  { id: "glassdoor", label: "Glassdoor" },
  { id: "google_jobs", label: "Google Jobs" },
]

export function SettingsWizard({ onSave }: SettingsWizardProps) {
  const [step, setStep] = useState(1)
  const [settings, setSettings] = useState<SettingsData>({
    job_sources: [],
    default_keywords: [],
    default_location: "",
    notification_email: false,
    notification_browser: false,
    notification_frequency: "instant",
  })

  const updateSetting = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const nextStep = () => setStep(prev => prev + 1)
  const prevStep = () => setStep(prev => prev - 1)

  const handleFinish = () => {
    onSave(settings)
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= s ? "bg-[var(--accent)] text-white" : "bg-[oklch(0.967_0.001_286.375)] text-[oklch(0.55_0_0)]"}
              `}>
                {step > s ? <Check size={16} /> : s}
              </div>
              {s < 4 && (
                <div className={`w-16 h-0.5 ${step > s ? "bg-[var(--accent)]" : "bg-[oklch(0.967_0.001_286.375)]"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Job Sources</h2>
          <p className="text-sm text-[oklch(0.55_0_0)] mb-4">
            Select which job platforms to search
          </p>
          <div className="space-y-3">
            {JOB_SOURCES.map(source => (
              <label key={source.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.job_sources.includes(source.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateSetting("job_sources", [...settings.job_sources, source.id])
                    } else {
                      updateSetting("job_sources", settings.job_sources.filter(s => s !== source.id))
                    }
                  }}
                  className="w-5 h-5 rounded border-[oklch(0.967_0.001_286.375)] text-[var(--accent)] focus:ring-[var(--accent)]"
                />
                <span>{source.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Search Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Location</label>
              <input
                type="text"
                value={settings.default_location}
                onChange={(e) => updateSetting("default_location", e.target.value)}
                placeholder="e.g., Remote, New York, NY"
                className="w-full px-3 py-2 border border-[oklch(0.967_0.001_286.375)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Default Keywords (comma-separated)</label>
              <input
                type="text"
                value={settings.default_keywords.join(", ")}
                onChange={(e) => updateSetting("default_keywords", e.target.value.split(",").map(k => k.trim()).filter(Boolean))}
                placeholder="e.g., Python, React, AWS"
                className="w-full px-3 py-2 border border-[oklch(0.967_0.001_286.375)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_email}
                onChange={(e) => updateSetting("notification_email", e.target.checked)}
                className="w-5 h-5 rounded border-[oklch(0.967_0.001_286.375)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span>Email notifications for new matching jobs</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notification_browser}
                onChange={(e) => updateSetting("notification_browser", e.target.checked)}
                className="w-5 h-5 rounded border-[oklch(0.967_0.001_286.375)] text-[var(--accent)] focus:ring-[var(--accent)]"
              />
              <span>Browser push notifications</span>
            </label>
            <div>
              <label className="block text-sm font-medium mb-2">Notification Frequency</label>
              <select
                value={settings.notification_frequency}
                onChange={(e) => updateSetting("notification_frequency", e.target.value)}
                className="w-full px-3 py-2 border border-[oklch(0.967_0.001_286.375)] rounded-lg focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="instant">Instant</option>
                <option value="daily">Daily digest</option>
                <option value="weekly">Weekly digest</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Review & Save</h2>
          <div className="space-y-4">
            <div className="p-4 bg-[oklch(0.967_0.001_286.375)] rounded-lg">
              <h3 className="font-medium mb-2">Job Sources</h3>
              <p className="text-sm text-[oklch(0.55_0_0)]">
                {settings.job_sources.length > 0 
                  ? settings.job_sources.map(s => JOB_SOURCES.find(js => js.id === s)?.label).join(", ")
                  : "None selected"}
              </p>
            </div>
            <div className="p-4 bg-[oklch(0.967_0.001_286.375)] rounded-lg">
              <h3 className="font-medium mb-2">Search Preferences</h3>
              <p className="text-sm text-[oklch(0.55_0_0)]">
                Location: {settings.default_location || "Not set"}
              </p>
              <p className="text-sm text-[oklch(0.55_0_0)]">
                Keywords: {settings.default_keywords.length > 0 ? settings.default_keywords.join(", ") : "None"}
              </p>
            </div>
            <div className="p-4 bg-[oklch(0.967_0.001_286.375)] rounded-lg">
              <h3 className="font-medium mb-2">Notifications</h3>
              <p className="text-sm text-[oklch(0.55_0_0)]">
                Email: {settings.notification_email ? "Enabled" : "Disabled"}
              </p>
              <p className="text-sm text-[oklch(0.55_0_0)]">
                Browser: {settings.notification_browser ? "Enabled" : "Disabled"}
              </p>
              <p className="text-sm text-[oklch(0.55_0_0)]">
                Frequency: {settings.notification_frequency}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          disabled={step === 1}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            step === 1 
              ? "text-[oklch(0.55_0_0)] cursor-not-allowed" 
              : "hover:bg-[oklch(0.967_0.001_286.375)]"
          }`}
        >
          <CaretLeft size={20} />
          Back
        </button>
        
        {step < 4 ? (
          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
          >
            Next
            <CaretRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90"
          >
            Save Settings
            <Check size={20} />
          </button>
        )}
      </div>
    </div>
  )
}