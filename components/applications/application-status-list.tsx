"use client"

import Link from "next/link"
import { ExternalLink, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { retryApplication } from "@/app/actions/applications"
import { MissingFieldsDialog } from "@/components/applications/missing-fields-dialog"
import { PlatformLogo } from "@/components/jobs/platform-logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getBrowserbaseSessionUrl } from "@/lib/automation/session-url"
import { isGeminiQuotaErrorMessage } from "@/lib/automation/format-error"
import {
  getApplicationStatusLabel,
  getApplicationStatusVariant,
} from "@/lib/applications/status"
import type { JobApplicationWithJob } from "@/lib/types/database"

type ApplicationStatusListProps = {
  applications: JobApplicationWithJob[]
}

export function ApplicationStatusList({
  applications,
}: ApplicationStatusListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [missingFieldsDialogOpen, setMissingFieldsDialogOpen] = useState(false)
  const [selectedApplication, setSelectedApplication] =
    useState<JobApplicationWithJob | null>(null)

  function handleRetry(applicationId: string) {
    startTransition(async () => {
      const result = await retryApplication(applicationId)
      if (result.success) {
        toast.success("Application retry started")
      } else {
        toast.error(result.error)
      }
    })
  }

  function openMissingFieldsDialog(application: JobApplicationWithJob) {
    setSelectedApplication(application)
    setMissingFieldsDialogOpen(true)
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No applications yet</CardTitle>
          <CardDescription>
            Start an auto-apply from a job card to track progress here.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {applications.map((application) => (
          <Card key={application.id}>
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <PlatformLogo
                  platform={application.job.platform}
                  className="size-10 shrink-0 rounded-md"
                />
                <div>
                  <CardTitle className="text-base">{application.job.title}</CardTitle>
                  <CardDescription>
                    {application.job.company ?? "Unknown company"} ·{" "}
                    {application.job.platform}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={getApplicationStatusVariant(application.status)}>
                {getApplicationStatusLabel(application.status)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.error_message ? (
                <div className="space-y-1">
                  <p className="text-xs text-destructive">
                    {application.error_message}
                  </p>
                  {isGeminiQuotaErrorMessage(application.error_message) ? (
                    <p className="text-xs text-muted-foreground">
                      Check your quota at{" "}
                      <a
                        href="https://ai.dev/rate-limit"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2"
                      >
                        ai.dev/rate-limit
                      </a>{" "}
                      or update{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-[0.65rem]">
                        STAGEHAND_MODEL
                      </code>{" "}
                      in .env.local.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {application.missing_fields.length > 0 ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="text-xs font-medium text-destructive">
                    Missing profile fields
                  </p>
                  <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
                    {application.missing_fields.map((field) => (
                      <li key={field.fieldId}>{field.label}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <a
                      href={application.job.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                >
                  <ExternalLink className="size-3.5" />
                  View Job
                </Button>

                {application.status === "missing_profile_info" ? (
                  <Button
                    size="sm"
                    onClick={() => openMissingFieldsDialog(application)}
                  >
                    Fill Missing Data
                  </Button>
                ) : null}

                {application.status === "failed" ? (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleRetry(application.id)}
                  >
                    <RefreshCw className="size-3.5" />
                    Retry
                  </Button>
                ) : null}

                {application.browserbase_session_id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    render={
                      <a
                        href={getBrowserbaseSessionUrl(
                          application.browserbase_session_id
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    View Browserbase Session
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <MissingFieldsDialog
        application={selectedApplication}
        open={missingFieldsDialogOpen}
        onOpenChange={setMissingFieldsDialogOpen}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
