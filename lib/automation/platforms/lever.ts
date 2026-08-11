import type { DetectedField } from "@/lib/types/database"
import {
  detectApplicationFields,
  fillAndSubmitApplication,
  type PlatformApplyConfig,
} from "@/lib/automation/platforms/shared"
import type {
  FillAndSubmitInput,
  PlatformAdapterContext,
} from "@/lib/automation/platforms/types"

const LEVER_CONFIG: PlatformApplyConfig = {
  openFormInstruction:
    "Click the Apply for this job button on the Lever application page if the form is not already visible",
  openFormRetryInstruction:
    "Click Apply for this job or any Start Application button until the Lever application form is visible",
}

export async function detectFields(
  ctx: PlatformAdapterContext
): Promise<DetectedField[]> {
  return detectApplicationFields(ctx, LEVER_CONFIG)
}

export async function fillAndSubmit(input: FillAndSubmitInput) {
  return fillAndSubmitApplication(input, LEVER_CONFIG)
}
