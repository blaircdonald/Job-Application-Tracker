import { Inngest } from "inngest"

import type { JobPlatform } from "@/lib/types/database"

export type ApplicationDetectFieldsEvent = {
  name: "app/application.detect-fields"
  data: {
    applicationId: string
    userId: string
    jobId: string
    jobUrl: string
    platform: JobPlatform
  }
}

export type ApplicationSubmitEvent = {
  name: "app/application.submit"
  data: {
    applicationId: string
    userId: string
    jobId: string
    jobUrl: string
    platform: JobPlatform
  }
}

export type ApplicationEvents =
  | ApplicationDetectFieldsEvent
  | ApplicationSubmitEvent

/**
 * Dev mode talks to the local Inngest Dev Server and never creates cloud runs.
 * On Vercel production that means auto-apply never starts a Browserbase session.
 */
export function isInngestDevMode() {
  if (process.env.VERCEL_ENV === "production") return false
  if (process.env.INNGEST_DEV === "0") return false
  if (process.env.INNGEST_DEV === "1") return true
  return process.env.NODE_ENV === "development"
}

export const inngest = new Inngest({
  id: "ai-job-application-agent",
  eventKey: process.env.INNGEST_EVENT_KEY,
  isDev: isInngestDevMode(),
})
