import { useState, useCallback } from "react"
import { Upload, File, XCircle, CheckCircle } from "@phosphor-icons/react"

interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void>
  uploading?: boolean
  error?: string | null
  success?: boolean
}

export function UploadDropzone({ onUpload, uploading, error, success }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (ext === "pdf" || ext === "docx") {
        setSelectedFile(file)
        await onUpload(file)
      }
    }
  }, [onUpload])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const ext = file.name.split(".").pop()?.toLowerCase()
      if (ext === "pdf" || ext === "docx") {
        setSelectedFile(file)
        await onUpload(file)
      }
    }
  }

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging 
            ? "border-[var(--accent)] bg-[var(--accent)]/5" 
            : "border-[oklch(0.967_0.001_286.375)] hover:border-[var(--accent)]"
          }
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${isDragging ? "bg-[var(--accent)]/10" : "bg-[oklch(0.967_0.001_286.375)]"}
          `}>
            <Upload 
              size={32} 
              weight={isDragging ? "fill" : "regular"}
              className={isDragging ? "text-[var(--accent)]" : "text-[oklch(0.967_0.001_286.375)]"}
            />
          </div>
          
          <div>
            <p className="text-lg font-semibold text-[oklch(0.15_0_0)]">
              {uploading ? "Uploading..." : "Upload Resume"}
            </p>
            <p className="text-sm text-[oklch(0.55_0_0)] mt-1">
              Drag and drop or click to browse
            </p>
            <p className="text-xs text-[oklch(0.55_0_0)] mt-1">
              PDF or DOCX, max 10MB
            </p>
          </div>
        </div>
      </div>

      {selectedFile && !uploading && (
        <div className="mt-4 p-4 bg-[oklch(0.967_0.001_286.375)] rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <File size={24} className="text-[oklch(0.55_0_0)]" />
            <span className="text-sm font-medium">{selectedFile.name}</span>
          </div>
          {success && <CheckCircle size={20} className="text-green-600" />}
          {error && <XCircle size={20} className="text-[var(--destructive)]" />}
        </div>
      )}

      {error && (
        <p className="mt-2 text-sm text-[var(--destructive)]">
          {error}
        </p>
      )}
    </div>
  )
}