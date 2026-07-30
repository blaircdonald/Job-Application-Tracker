import {
  closeAutomationSession,
  createAutomationSession,
} from "@/lib/automation/browserbase"
import {
  formatAutomationError,
  isGeminiQuotaError,
} from "@/lib/automation/format-error"
import {
  mapFieldsToProfile,
  profileHasResume,
} from "@/lib/automation/map-fields"
import { getPlatformAdapter } from "@/lib/automation/platforms"
import {
  getApplicationById,
  markJobAsApplied,
  updateApplicationStatus,
} from "@/lib/applications/queries"
import {
  downloadResumeToTempFile,
  getLatestParsedResume,
} from "@/lib/applications/resume"
import { inngest } from "@/lib/inngest/client"
import { NonRetriableError } from "inngest"
import { getFullProfileWithClient } from "@/lib/profile/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import type { JobPlatform } from "@/lib/types/database"

export const submitApplication = inngest.createFunction(
  {
    id: "submit-application",
    retries: 2,
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
    triggers: [{ event: "app/application.submit" }],
  },
  async ({ event, step }) => {
    const { applicationId, userId, jobId, jobUrl, platform } = event.data
    const supabase = createAdminClient()

    const application = await step.run("load-application", async () => {
      const app = await getApplicationById(supabase, applicationId)
      if (!app) {
        throw new Error("Application not found")
      }

      if (
        app.status !== "ready_to_submit" &&
        app.status !== "missing_profile_info"
      ) {
        throw new Error(`Application is not ready to submit: ${app.status}`)
      }

      return app
    })

    if (application.status === "missing_profile_info") {
      const recheck = await step.run("recheck-profile-fields", async () => {
        const profile = await getFullProfileWithClient(supabase, userId)
        if (!profile) {
          throw new Error("User profile not found")
        }

        const resume = await getLatestParsedResume(supabase, userId)
        const hasResume = profileHasResume(profile, resume ? [resume] : [])
        return mapFieldsToProfile(
          application.detected_fields,
          profile,
          hasResume,
          application.application_field_values
        )
      })

      if (recheck.missing.length > 0) {
        await step.run("keep-missing-profile-info", async () => {
          await updateApplicationStatus(supabase, applicationId, {
            status: "missing_profile_info",
            missing_fields: recheck.missing,
          })
        })
        return { status: "missing_profile_info" as const }
      }

      await step.run("promote-ready-to-submit", async () => {
        await updateApplicationStatus(supabase, applicationId, {
          status: "ready_to_submit",
          missing_fields: [],
        })
      })
    }

    await step.run("set-submitting-status", async () => {
      await updateApplicationStatus(supabase, applicationId, {
        status: "submitting",
      })
    })

    try {
      await step.run("fill-and-submit-form", async () => {
        const session = await createAutomationSession(applicationId)

        try {
          const profile = await getFullProfileWithClient(supabase, userId)
          if (!profile) {
            throw new Error("User profile not found")
          }

          const latestApplication = await getApplicationById(
            supabase,
            applicationId
          )
          if (!latestApplication) {
            throw new Error("Application not found")
          }

          const resume = await getLatestParsedResume(supabase, userId)
          const hasResume = profileHasResume(profile, resume ? [resume] : [])
          const mapping = mapFieldsToProfile(
            latestApplication.detected_fields,
            profile,
            hasResume,
            latestApplication.application_field_values
          )

          let resumeFilePath: string | null = null
          if (resume && hasResume) {
            resumeFilePath = await downloadResumeToTempFile(supabase, resume)
          }

          const adapter = getPlatformAdapter(platform as JobPlatform)
          await adapter.fillAndSubmit({
            stagehand: session.stagehand,
            jobUrl,
            profile,
            detectedFields: latestApplication.detected_fields,
            mappedFields: mapping.mapped,
            resumeFilePath,
          })
        } finally {
          await closeAutomationSession(session)
        }
      })

      await step.run("mark-submitted", async () => {
        await updateApplicationStatus(supabase, applicationId, {
          status: "submitted",
          submitted_at: new Date().toISOString(),
          error_message: null,
        })
        await markJobAsApplied(supabase, userId, jobId)
      })

      return { status: "submitted" as const }
    } catch (error) {
      const message = formatAutomationError(error)

      await step.run("mark-submit-failed", async () => {
        await updateApplicationStatus(supabase, applicationId, {
          status: "failed",
          error_message: message,
        })
      })

      if (isGeminiQuotaError(error)) {
        throw new NonRetriableError(message)
      }

      throw error
    }
  }
)
