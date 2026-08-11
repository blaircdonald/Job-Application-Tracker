import { serve } from "inngest/next"

import { inngest, isInngestDevMode } from "@/lib/inngest/client"
import { detectApplicationFields } from "@/lib/inngest/functions/detect-application-fields"
import { submitApplication } from "@/lib/inngest/functions/submit-application"

// Force cloud mode on Vercel production even if INNGEST_DEV leaked into env.
if (process.env.VERCEL_ENV === "production" && process.env.INNGEST_DEV === "1") {
  process.env.INNGEST_DEV = "0"
}

export const maxDuration = 300

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [detectApplicationFields, submitApplication],
})

// Keep a server-side breadcrumb for debugging deploy mode.
if (process.env.NODE_ENV !== "test") {
  console.info(
    `[inngest] serve ready (devMode=${isInngestDevMode()}, vercelEnv=${process.env.VERCEL_ENV ?? "n/a"})`
  )
}
