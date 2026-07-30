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

export const inngest = new Inngest({
  id: "ai-job-application-agent",
  eventKey: process.env.INNGEST_EVENT_KEY,
})
