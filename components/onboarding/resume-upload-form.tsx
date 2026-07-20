"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { FileUploadIcon } from "@hugeicons/core-free-icons"

import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  ACCEPTED_RESUME_EXTENSIONS,
  MAX_RESUME_SIZE,
} from "@/lib/resume/constants"
import { cn } from "@/lib/utils"

type UploadState = "idle" | "uploading" | "processing" | "error" | "done"

type ResumeUploadFormProps = {
  compact?: boolean
  onSuccess?: () => void
}

export function ResumeUploadForm({
  compact = false,
  onSuccess,
}: ResumeUploadFormProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>("idle")
  const [fileName, setFileName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const isBusy = state === "uploading" || state === "processing"

  async function handleFile(file: File) {
    if (file.size > MAX_RESUME_SIZE) {
      setState("error")
      setErrorMessage("File size must be 5 MB or less.")
      return
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase()}`
    if (!ACCEPTED_RESUME_EXTENSIONS.includes(extension as ".pdf" | ".docx")) {
      setState("error")
      setErrorMessage("Please upload a PDF or DOCX file.")
      return
    }

    setFileName(file.name)
    setState("uploading")
    setErrorMessage(null)

    const formData = new FormData()
    formData.append("file", file)

    setState("processing")

    const response = await fetch("/api/resume/upload", {
      method: "POST",
      body: formData,
    })

    const result = (await response.json()) as
      | { success: true; resumeId: string }
      | { success: false; error: string }

    if (!result.success) {
      setState("error")
      setErrorMessage(result.error)
      toast.error(result.error)
      return
    }

    setState("done")
    toast.success("Resume uploaded and profile populated!")
    onSuccess?.()
    router.refresh()
  }

  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void handleFile(file)
    event.target.value = ""
  }

  function onDrop(event: React.DragEvent) {
    event.preventDefault()
    setIsDragging(false)
    if (isBusy) return

    const file = event.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  const attachmentState =
    state === "uploading" || state === "processing"
      ? state
      : state === "error"
        ? "error"
        : state === "done"
          ? "done"
          : "idle"

  return (
    <div className={cn("space-y-4", compact ? "max-w-xl" : "max-w-lg")}>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          if (!isBusy) setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-xl border border-dashed p-6 transition-colors",
          isDragging && "border-primary bg-primary/5",
          isBusy && "pointer-events-none opacity-80"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={onInputChange}
          disabled={isBusy}
        />

        {state === "idle" || state === "error" ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <HugeiconsIcon
                icon={FileUploadIcon}
                strokeWidth={2}
                className="size-6 text-muted-foreground"
              />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag and drop your resume here
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF or DOCX, up to 5 MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Choose file
            </Button>
            {errorMessage && (
              <p className="text-xs text-destructive">{errorMessage}</p>
            )}
          </div>
        ) : (
          <Attachment state={attachmentState} className="w-full">
            <AttachmentMedia variant="icon">
              {isBusy ? <Spinner /> : null}
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{fileName ?? "Resume"}</AttachmentTitle>
              <AttachmentDescription>
                {state === "uploading" && "Uploading your resume..."}
                {state === "processing" && "Analyzing your resume with AI..."}
                {state === "done" && "Resume parsed successfully!"}
              </AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        )}
      </div>

      {!compact && (
        <p className="text-xs text-muted-foreground">
          We&apos;ll extract your profile details, skills, experience, and
          education automatically so you can review and edit them on your
          Profile page.
        </p>
      )}
    </div>
  )
}
