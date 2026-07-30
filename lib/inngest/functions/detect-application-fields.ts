import {
  closeAutomationSession,
  createAutomationSession,
} from "@/lib/automation/browserbase"
import {
  mapFieldsToProfile,
  profileHasResume,
} from "@/lib/automation/map-fields"
import { getPlatformAdapter } from "@/lib/automation/platforms"
import { updateApplicationStatus } from "@/lib/applications/queries"
import { getLatestParsedResume } from "@/lib/applications/resume"
import { inngest } from "@/lib/inngest/client"
import { getFullProfileWithClient } from "@/lib/profile/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import type { JobPlatform } from "@/lib/types/database"

export const detectApplicationFields = inngest.createFunction(
  {
    id: "detect-application-fields",
    retries: 2,
    concurrency: {
      limit: 1,
      key: "event.data.userId",
    },
    triggers: [{ event: "app/application.detect-fields" }],
  },
  async ({ event, step }) => {
    const { applicationId, userId, jobUrl, platform } = event.data
    const supabase = createAdminClient()

    await step.run("set-detecting-status", async () => {
      await updateApplicationStatus(supabase, applicationId, {
        status: "detecting_fields",
      })
    })

    const detectResult = await step.run("detect-form-fields", async () => {
      const session = await createAutomationSession(applicationId)

      try {
        const adapter = getPlatformAdapter(platform as JobPlatform)
        const detectedFields = await adapter.detectFields({
          stagehand: session.stagehand,
          jobUrl,
        })

        await updateApplicationStatus(supabase, applicationId, {
          detected_platform: platform,
          detected_fields: detectedFields,
        })

        return detectedFields
      } finally {
        await closeAutomationSession(session)
      }
    })

    const mappingResult = await step.run("map-profile-fields", async () => {
      const profile = await getFullProfileWithClient(supabase, userId)
      if (!profile) {
        throw new Error("User profile not found")
      }

      const resume = await getLatestParsedResume(supabase, userId)
      const hasResume = profileHasResume(profile, resume ? [resume] : [])

      return mapFieldsToProfile(detectResult, profile, hasResume)
    })

    if (mappingResult.missing.length > 0) {
      await step.run("set-missing-profile-info", async () => {
        await updateApplicationStatus(supabase, applicationId, {
          status: "missing_profile_info",
          missing_fields: mappingResult.missing,
        })
      })
      return { status: "missing_profile_info" as const }
    }

    await step.run("set-ready-to-submit", async () => {
      await updateApplicationStatus(supabase, applicationId, {
        status: "ready_to_submit",
        missing_fields: [],
      })
    })

    await step.sendEvent("trigger-submit", {
      name: "app/application.submit",
      data: event.data,
    })

    return { status: "ready_to_submit" as const }
  }
)
