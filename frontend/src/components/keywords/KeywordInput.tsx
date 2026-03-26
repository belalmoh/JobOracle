import { useState } from "react"
import { Plus, X } from "@phosphor-icons/react"

interface KeywordInputProps {
  keywords: string[]
  onAdd: (keyword: string) => void
  onRemove: (keyword: string) => void
}

export function KeywordInput({ keywords, onAdd, onRemove }: KeywordInputProps) {
  const [input, setInput] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault()
      onAdd(input.trim())
      setInput("")
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-3">
        {keywords.map((keyword, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-sm"
          >
            {keyword}
            <button
              onClick={() => onRemove(keyword)}
              className="hover:text-[var(--destructive)]"
            >
              <X size={14} weight="bold" />
            </button>
          </span>
        ))}
        {keywords.length === 0 && (
          <p className="text-sm text-[oklch(0.55_0_0)]">No keywords added yet</p>
        )}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type keyword and press Enter"
          className="flex-1 px-3 py-2 border border-[oklch(0.967_0.001_286.375)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={() => {
            if (input.trim()) {
              onAdd(input.trim())
              setInput("")
            }
          }}
          className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}