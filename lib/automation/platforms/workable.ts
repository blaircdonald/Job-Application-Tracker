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

const WORKABLE_CONFIG: PlatformApplyConfig = {
  openFormInstruction:
    "Click the Apply for this job button on the Workable application page if the form is not already visible",
  openFormRetryInstruction:
    "Click Apply for this job or Continue until the Workable application form is visible",
}

export async function detectFields(
  ctx: PlatformAdapterContext
): Promise<DetectedField[]> {
  return detectApplicationFields(ctx, WORKABLE_CONFIG)
}

export async function fillAndSubmit(input: FillAndSubmitInput) {
  return fillAndSubmitApplication(input, WORKABLE_CONFIG)
}
