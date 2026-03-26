import { useState } from "react"
import { CaretRight, CaretDown, Trash } from "@phosphor-icons/react"

interface ParsedData {
  contact?: { name?: string; email?: string; phone?: string; location?: string }
  summary?: string
  skills?: string[]
  experience?: { title?: string; company?: string; duration?: string; description?: string }[]
  education?: { degree?: string; school?: string; year?: string }[]
}

interface ParsedDataDisplayProps {
  parsedData: ParsedData | null
  extractedText: string | null
  showSourceText: boolean
  onToggleView: () => void
  onRemoveSkill?: (skill: string) => void
}

export function ParsedDataDisplay({ 
  parsedData, 
  extractedText, 
  showSourceText, 
  onToggleView,
  onRemoveSkill 
}: ParsedDataDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    skills: true,
    experience: true,
    education: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  if (showSourceText) {
    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Extracted Text</h3>
          <button
            onClick={onToggleView}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            View Parsed Data
          </button>
        </div>
        <div className="p-4 bg-[oklch(0.967_0.001_286.375)] rounded-lg">
          <pre className="whitespace-pre-wrap text-sm font-mono">
            {extractedText || "No text extracted"}
          </pre>
        </div>
      </div>
    )
  }

  if (!parsedData) return null

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Parsed Resume</h3>
        <button
          onClick={onToggleView}
          className="text-sm text-[var(--accent)] hover:underline"
        >
          View Source Text
        </button>
      </div>

      <div className="space-y-3">
        {parsedData.summary && (
          <div className="p-4 bg-[oklch(0.967_0.001_286.375)] rounded-lg">
            <h4 className="font-medium mb-2">Summary</h4>
            <p className="text-sm text-[oklch(0.55_0_0)]">{parsedData.summary}</p>
          </div>
        )}

        <div className="border border-[oklch(0.967_0.001_286.375)] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("skills")}
            className="w-full flex items-center justify-between p-4 hover:bg-[oklch(0.967_0.001_286.375)] transition-colors"
          >
            <span className="font-medium">Skills</span>
            {expandedSections.skills ? (
              <CaretDown size={20} />
            ) : (
              <CaretRight size={20} />
            )}
          </button>
          {expandedSections.skills && (
            <div className="p-4 pt-0 border-t border-[oklch(0.967_0.001_286.375)]">
              <div className="flex flex-wrap gap-2">
                {parsedData.skills?.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-sm"
                  >
                    {skill}
                    {onRemoveSkill && (
                      <button
                        onClick={() => onRemoveSkill(skill)}
                        className="hover:text-[var(--destructive)]"
                      >
                        <Trash size={14} />
                      </button>
                    )}
                  </span>
                ))}
                {!parsedData.skills?.length && (
                  <p className="text-sm text-[oklch(0.55_0_0)]">No skills found</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="border border-[oklch(0.967_0.001_286.375)] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("experience")}
            className="w-full flex items-center justify-between p-4 hover:bg-[oklch(0.967_0.001_286.375)] transition-colors"
          >
            <span className="font-medium">Experience</span>
            {expandedSections.experience ? (
              <CaretDown size={20} />
            ) : (
              <CaretRight size={20} />
            )}
          </button>
          {expandedSections.experience && (
            <div className="p-4 pt-0 border-t border-[oklch(0.967_0.001_286.375)]">
              {parsedData.experience?.length ? (
                <div className="space-y-3">
                  {parsedData.experience.map((exp, idx) => (
                    <div key={idx}>
                      <p className="font-medium">{exp.title}</p>
                      <p className="text-sm text-[oklch(0.55_0_0)]">{exp.company} • {exp.duration}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[oklch(0.55_0_0)]">No experience found</p>
              )}
            </div>
          )}
        </div>

        <div className="border border-[oklch(0.967_0.001_286.375)] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection("education")}
            className="w-full flex items-center justify-between p-4 hover:bg-[oklch(0.967_0.001_286.375)] transition-colors"
          >
            <span className="font-medium">Education</span>
            {expandedSections.education ? (
              <CaretDown size={20} />
            ) : (
              <CaretRight size={20} />
            )}
          </button>
          {expandedSections.education && (
            <div className="p-4 pt-0 border-t border-[oklch(0.967_0.001_286.375)]">
              {parsedData.education?.length ? (
                <div className="space-y-3">
                  {parsedData.education.map((edu, idx) => (
                    <div key={idx}>
                      <p className="font-medium">{edu.degree}</p>
                      <p className="text-sm text-[oklch(0.55_0_0)]">{edu.school} • {edu.year}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[oklch(0.55_0_0)]">No education found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}