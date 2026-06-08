import { useRef, useState } from "react"

export const FileUpload = ({ onFileSelect, disabled = false }) => {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFiles = (files) => {
    if (!files?.length || disabled) return
    onFileSelect(files[0])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Upload CSV or Excel file"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={[
        "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        dragOver ? "border-blue-500 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-400",
        disabled ? "pointer-events-none opacity-50" : "",
      ].join(" ")}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        aria-hidden
      />
      <p className="text-lg font-medium text-slate-800">Drag and drop your file here</p>
      <p className="mt-2 text-sm text-slate-500">CSV, XLS, or XLSX — required column: store_url</p>
    </div>
  )
}
