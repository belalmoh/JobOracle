import { useState, useEffect, useRef, useCallback } from "react"
import { Plus, X, MagnifyingGlass } from "@phosphor-icons/react"
import { api } from "@/lib/api"

interface KeywordInputProps {
  keywords: string[]
  onAdd: (keyword: string) => void
  onRemove: (keyword: string) => void
}

interface KeywordSuggestion {
  id: number
  keyword: string
  source: string
}

export function KeywordInput({ keywords, onAdd, onRemove }: KeywordInputProps) {
  const [input, setInput] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [touched, setTouched] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || !touched) {
      setSuggestions([])
      return
    }
    
    setLoading(true)
    try {
      const results = await api.keywords.search(query.trim())
      setSuggestions(results || [])
    } catch (err) {
      console.error("Failed to search keywords:", err)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }, [touched])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (input.trim() && touched) {
      searchTimeoutRef.current = setTimeout(() => {
        loadSuggestions(input)
      }, 300)
    } else {
      setSuggestions([])
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [input, touched, loadSuggestions])

  const filteredSuggestions = suggestions.filter(
    s => !keywords.some(k => k.toLowerCase() === s.keyword.toLowerCase())
  )

  const handleSelectSuggestion = (keyword: string) => {
    setInput("")
    setShowDropdown(false)
    onAdd(keyword)
  }

  const handleCreateNew = async () => {
    if (!input.trim() || isCreating) return
    
    setIsCreating(true)
    try {
      await api.keywords.create(input.trim())
      onAdd(input.trim())
      setInput("")
      setShowDropdown(false)
    } catch (err) {
      console.error("Failed to create keyword:", err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    setTouched(true)
    if (!showDropdown) {
      setShowDropdown(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault()
      const exactMatch = suggestions.find(
        s => s.keyword.toLowerCase() === input.trim().toLowerCase()
      )
      if (exactMatch) {
        handleSelectSuggestion(exactMatch.keyword)
      } else {
        handleCreateNew()
      }
    } else if (e.key === "Escape") {
      setShowDropdown(false)
    }
  }

  const showCreateOption = input.trim() && !loading && !filteredSuggestions.some(
    s => s.keyword.toLowerCase() === input.trim().toLowerCase()
  )

  return (
    <div className="w-full" ref={dropdownRef}>
      <div className="flex flex-wrap gap-2 mb-3">
        {keywords.map((keyword, idx) => (
          <span
            key={`${keyword}-${idx}`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--accent)]/10 text-[var(--accent)] rounded-full text-sm"
          >
            {keyword}
            <button
              onClick={() => onRemove(keyword)}
              className="hover:text-[var(--destructive)] transition-colors"
            >
              <X size={14} weight="bold" />
            </button>
          </span>
        ))}
        {keywords.length === 0 && (
          <p className="text-sm text-[oklch(0.55_0_0)]">No keywords added yet</p>
        )}
      </div>
      
      <div className="relative">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onFocus={() => {
                setTouched(true)
                setShowDropdown(true)
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                setTimeout(() => setShowDropdown(false), 200)
              }}
              placeholder="Type keyword..."
              className="w-full px-3 py-2 pl-9 border border-[oklch(0.967_0.001_286.375)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent)]"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[oklch(0.55_0_0)]">
              {loading ? (
                <div className="w-4 h-4 border-2 border-[oklch(0.55_0_0)] border-t-[var(--accent)] rounded-full animate-spin" />
              ) : (
                <MagnifyingGlass size={18} />
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreateNew}
            disabled={!input.trim() || isCreating}
            className="px-3 py-2 bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus size={20} />
          </button>
        </div>

        {showDropdown && touched && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-[oklch(0.967_0.001_286.375)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {!input.trim() ? (
              <div className="p-3 text-sm text-[oklch(0.55_0_0)]">
                Start typing to search or create keywords
              </div>
            ) : loading ? (
              <div className="p-3 text-sm text-[oklch(0.55_0_0)] flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[oklch(0.55_0_0)] border-t-[var(--accent)] rounded-full animate-spin" />
                Searching...
              </div>
            ) : filteredSuggestions.length > 0 ? (
              <>
                {filteredSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion.keyword)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-[oklch(0.967_0.001_286.375)] flex items-center justify-between"
                  >
                    <span>{suggestion.keyword}</span>
                    <span className="text-xs text-[oklch(0.55_0_0)]">{suggestion.source}</span>
                  </button>
                ))}
              </>
            ) : null}
            
            {showCreateOption && (
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={isCreating}
                className="w-full px-3 py-2 text-left text-sm text-[var(--accent)] hover:bg-[oklch(0.967_0.001_286.375)] border-t border-[oklch(0.967_0.001_286.375)] flex items-center gap-2"
              >
                <Plus size={16} />
                {isCreating ? "Creating..." : `Create "${input.trim()}"`}
              </button>
            )}
            
            {!showCreateOption && !loading && input.trim() && filteredSuggestions.length === 0 && (
              <div className="p-3 text-sm text-[oklch(0.55_0_0)]">
                No matching keywords found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
