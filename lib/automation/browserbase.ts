import "server-only"

import { createStagehand } from "@/lib/automation/stagehand-client"
import { updateApplicationStatus } from "@/lib/applications/queries"
import { createAdminClient } from "@/lib/supabase/admin"
import type { StagehandInstance } from "@/lib/automation/stagehand-client"

export { getBrowserbaseSessionUrl } from "@/lib/automation/session-url"

export type AutomationSession = {
  stagehand: StagehandInstance
  sessionId: string
}

export async function createAutomationSession(
  applicationId: string
): Promise<AutomationSession> {
  const stagehand = await createStagehand()
  const sessionId = stagehand.browserbaseSessionID

  if (!sessionId) {
    throw new Error("Browserbase session ID was not created")
  }

  const supabase = createAdminClient()
  await updateApplicationStatus(supabase, applicationId, {
    browserbase_session_id: sessionId,
  })

  return { stagehand, sessionId }
}

export async function closeAutomationSession(session: AutomationSession) {
  try {
    await session.stagehand.close()
  } catch {
    // Session may already be closed.
  }
}
