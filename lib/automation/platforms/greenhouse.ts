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

const GREENHOUSE_CONFIG: PlatformApplyConfig = {
  openFormInstruction:
    "Click the Apply or Submit Application button to open the Greenhouse application form if it is not already visible",
  openFormRetryInstruction:
    "Click through any Apply or Start Application buttons until the main Greenhouse application form is visible",
}

export async function detectFields(
  ctx: PlatformAdapterContext
): Promise<DetectedField[]> {
  return detectApplicationFields(ctx, GREENHOUSE_CONFIG)
}

export async function fillAndSubmit(input: FillAndSubmitInput) {
  return fillAndSubmitApplication(input, GREENHOUSE_CONFIG)
}
