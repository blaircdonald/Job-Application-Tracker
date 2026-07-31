"use client"

import { Bot, ExternalLink, Hand } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  getApplicationForJobAction,
  startAutoApply,
} from "@/app/actions/applications"
import { markJobApplied } from "@/app/actions/jobs"
import { MissingFieldsDialog } from "@/components/applications/missing-fields-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { isAutoApplySupported } from "@/lib/automation/detect-platform"
import { isActiveApplicationStatus } from "@/lib/applications/status"
import type { ApplicationStatus, Job, JobApplication } from "@/lib/types/database"
import { cn } from "@/lib/utils"

type ApplyMethodDialogProps = {
  job: Job
  open: boolean
  onOpenChange: (open: boolean) => void
  onApplied?: () => void
}

function getStatusMessage(status: ApplicationStatus) {
  switch (status) {
    case "queued":
      return "Your application is queued."
    case "detecting_fields":
      return "Detecting application form fields..."
    case "missing_profile_info":
      return "Some required fields are missing. Fill them in to continue."
    case "ready_to_submit":
      return "Profile ready. Submitting soon..."
    case "submitting":
      return "Submitting your application..."
    case "submitted":
      return "Application submitted successfully."
    case "failed":
      return "Application failed. Try again from Application Status."
    default:
      return ""
  }
}

export function ApplyMethodDialog({
  job,
  open,
  onOpenChange,
  onApplied,
}: ApplyMethodDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [application, setApplication] = useState<JobApplication | null>(null)
  const [missingFieldsDialogOpen, setMissingFieldsDialogOpen] = useState(false)

  const applicationStatus = application?.status ?? null
  const autoApplySupported = isAutoApplySupported(job.platform)
  const hasActiveApplication =
    applicationStatus !== null && isActiveApplicationStatus(applicationStatus)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      startTransition(async () => {
        const result = await getApplicationForJobAction(job.id)
        if (result.success) {
          setApplication(result.application)
        }
      })
    }
    onOpenChange(nextOpen)
  }

  function handleManualApply() {
    window.open(job.job_url, "_blank", "noopener,noreferrer")
    onOpenChange(false)

    startTransition(async () => {
      const result = await markJobApplied(job.id)
      if (result.success) {
        onApplied?.()
        toast.success("Job opened — marked as applied and removed from matches.")
      }
    })
  }

  function handleAutoApply() {
    startTransition(async () => {
      const result = await startAutoApply(job.id)
      if (result.success) {
        setApplication(result.application)
        toast.success("Auto-apply started. Track progress in Application Status.")
        onOpenChange(false)
        router.push("/dashboard/application-status")
      } else {
        toast.error(result.error)
      }
    })
  }

  const applicationWithJob =
    application && application.status === "missing_profile_info"
      ? { ...application, job }
      : null

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>How would you like to apply?</DialogTitle>
            <DialogDescription>
              Choose how you want to apply to {job.title}
              {job.company ? ` at ${job.company}` : ""}.
            </DialogDescription>
          </DialogHeader>

          {applicationStatus ? (
            <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {getStatusMessage(applicationStatus)}
            </p>
          ) : null}

          {applicationStatus === "missing_profile_info" &&
          application &&
          application.missing_fields.length > 0 ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive">
                Missing fields
              </p>
              <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                {application.missing_fields.map((field) => (
                  <li key={field.fieldId}>{field.label}</li>
                ))}
              </ul>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => setMissingFieldsDialogOpen(true)}
              >
                Fill Missing Data
              </Button>
            </div>
          ) : null}

          <div className="grid gap-3">
            <button
              type="button"
              onClick={handleManualApply}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
              )}
            >
              <ExternalLink className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Apply Manually</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Open the job application URL in a new tab and apply yourself.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={handleAutoApply}
              disabled={
                !autoApplySupported || hasActiveApplication || isPending
              }
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                autoApplySupported && !hasActiveApplication
                  ? "hover:bg-muted/50"
                  : "cursor-not-allowed opacity-60"
              )}
            >
              <Bot className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="text-sm font-medium">Auto-Apply with AI</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {autoApplySupported
                    ? "Detect form fields, fill your profile data, attach your resume, and submit."
                    : "Auto-apply is not available for this platform yet. Use manual apply."}
                </p>
              </div>
            </button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleManualApply}>
              <Hand className="size-3.5" />
              Apply Manually
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MissingFieldsDialog
        application={applicationWithJob}
        open={missingFieldsDialogOpen}
        onOpenChange={setMissingFieldsDialogOpen}
        onSaved={() => {
          router.refresh()
          router.push("/dashboard/application-status")
        }}
      />
    </>
  )
}
