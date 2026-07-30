"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { retryApplication } from "@/app/actions/applications"
import { MissingFieldsDialog } from "@/components/applications/missing-fields-dialog"
import { Button } from "@/components/ui/button"
import type { JobApplicationWithJob } from "@/lib/types/database"

type PendingApplicationBannerProps = {
  application: JobApplicationWithJob
}

export function PendingApplicationBanner({
  application,
}: PendingApplicationBannerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [missingFieldsDialogOpen, setMissingFieldsDialogOpen] = useState(false)

  function handleContinue() {
    startTransition(async () => {
      const result = await retryApplication(application.id)
      if (result.success) {
        toast.success("Continuing your application...")
        router.push("/dashboard/application-status")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <>
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
        <p className="text-sm font-medium">
          Complete these fields to continue your application to{" "}
          {application.job.title}
          {application.job.company ? ` at ${application.job.company}` : ""}
        </p>
        {application.missing_fields.length > 0 ? (
          <ul className="mt-2 list-inside list-disc text-xs text-muted-foreground">
            {application.missing_fields.map((field) => (
              <li key={field.fieldId}>{field.label}</li>
            ))}
          </ul>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => setMissingFieldsDialogOpen(true)}
          >
            Fill Missing Data
          </Button>
          <Button size="sm" variant="outline" disabled={isPending} onClick={handleContinue}>
            {isPending ? "Continuing..." : "Continue Application"}
          </Button>
          {application.missing_fields.some((field) => field.profileKey === "resume") ? (
            <Button size="sm" variant="outline" render={<Link href="/dashboard/resume" />}>
              Upload Resume
            </Button>
          ) : null}
        </div>
      </div>

      <MissingFieldsDialog
        application={application}
        open={missingFieldsDialogOpen}
        onOpenChange={setMissingFieldsDialogOpen}
        onSaved={() => router.refresh()}
      />
    </>
  )
}
