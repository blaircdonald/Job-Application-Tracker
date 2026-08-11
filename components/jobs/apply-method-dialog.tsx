"use client"

import { Bot, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  getApplicationForJobAction,
  getDailyApplyUsageAction,
  startAutoApply,
} from "@/app/actions/applications"
import { markJobApplied } from "@/app/actions/jobs"
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
import { DAILY_APPLY_LIMIT_MESSAGE } from "@/lib/applications/daily-limit"
import {
  canRestartAutoApply,
  getApplicationStatusLabel,
  isInFlightAutoApplyStatus,
} from "@/lib/applications/status"
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
      return "Your application is queued. The AI agent will start shortly."
    case "detecting_fields":
      return "Detecting application form fields in Browserbase..."
    case "missing_profile_info":
      return "Some required fields are missing. Complete them in your profile to continue."
    case "ready_to_submit":
      return "Profile ready. Submitting your application..."
    case "submitting":
      return "Submitting your application via the AI agent..."
    case "submitted":
      return "Application submitted successfully."
    case "failed":
      return "Application failed. You can retry automatic apply."
    default:
      return getApplicationStatusLabel(status)
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
  const [remainingApplies, setRemainingApplies] = useState<number | null>(null)

  const applicationStatus = application?.status ?? null
  const autoApplySupported = isAutoApplySupported(job.platform)
  const inFlight =
    applicationStatus !== null && isInFlightAutoApplyStatus(applicationStatus)
  const needsProfile =
    applicationStatus === "missing_profile_info"
  const canRestart =
    applicationStatus !== null && canRestartAutoApply(applicationStatus)
  const atDailyLimit = remainingApplies !== null && remainingApplies <= 0
  const canStartAutoApply =
    autoApplySupported &&
    !inFlight &&
    !needsProfile &&
    !isPending &&
    (!atDailyLimit || canRestart)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      startTransition(async () => {
        const [applicationResult, usageResult] = await Promise.all([
          getApplicationForJobAction(job.id),
          getDailyApplyUsageAction(),
        ])
        if (applicationResult.success) {
          setApplication(applicationResult.application)
        }
        if (usageResult.success) {
          setRemainingApplies(usageResult.usage.remaining)
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
      } else {
        toast.error(result.error)
      }
    })
  }

  function handleAutoApply() {
    if (needsProfile && application) {
      onOpenChange(false)
      router.push(`/dashboard/profile?applicationId=${application.id}`)
      return
    }

    if (atDailyLimit && !canRestart) {
      toast.error(DAILY_APPLY_LIMIT_MESSAGE)
      return
    }

    startTransition(async () => {
      const result = await startAutoApply(job.id)
      if (result.success) {
        setApplication(result.application)
        toast.success(
          "Automatic apply started. Track progress in Application Status."
        )
        onOpenChange(false)
        router.refresh()
        router.push("/dashboard/application-status")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How would you like to apply?</DialogTitle>
          <DialogDescription>
            Choose how you want to apply to {job.title}
            {job.company ? ` at ${job.company}` : ""}.
          </DialogDescription>
        </DialogHeader>

        {atDailyLimit && !canRestart ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {DAILY_APPLY_LIMIT_MESSAGE}
          </p>
        ) : remainingApplies !== null ? (
          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {remainingApplies} auto-applies remaining today
          </p>
        ) : null}

        {applicationStatus ? (
          <p className="rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            {getStatusMessage(applicationStatus)}
          </p>
        ) : null}

        {needsProfile &&
        application &&
        application.missing_fields.length > 0 ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="text-xs font-medium text-destructive">
              Missing profile fields
            </p>
            <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
              {application.missing_fields.map((field) => (
                <li key={field.fieldId}>{field.label}</li>
              ))}
            </ul>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => {
                onOpenChange(false)
                router.push(`/dashboard/profile?applicationId=${application.id}`)
              }}
            >
              Complete Profile
            </Button>
          </div>
        ) : null}

        <div className="grid gap-3">
          <button
            type="button"
            onClick={handleManualApply}
            disabled={isPending}
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
              needsProfile
                ? isPending
                : !canStartAutoApply
            }
            className={cn(
              "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
              needsProfile || canStartAutoApply
                ? "hover:bg-muted/50"
                : "cursor-not-allowed opacity-60"
            )}
          >
            <Bot className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="text-sm font-medium">
                {needsProfile
                  ? "Complete Profile to Continue"
                  : "Apply Automatically using AI Agent"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {!autoApplySupported
                  ? "Auto-apply is not available for this platform yet. Use manual apply."
                  : needsProfile
                    ? "Finish the missing profile fields, then the agent will submit."
                    : "Detect form fields, fill your profile data, attach your resume, and submit in Browserbase."}
              </p>
            </div>
          </button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
