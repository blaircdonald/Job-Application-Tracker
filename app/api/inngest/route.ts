import { serve } from "inngest/next"

import { inngest } from "@/lib/inngest/client"
import { detectApplicationFields } from "@/lib/inngest/functions/detect-application-fields"
import { submitApplication } from "@/lib/inngest/functions/submit-application"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [detectApplicationFields, submitApplication],
})
