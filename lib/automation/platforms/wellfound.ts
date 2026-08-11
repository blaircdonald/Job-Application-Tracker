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

const WELLFOUND_CONFIG: PlatformApplyConfig = {
  openFormInstruction:
    "Click the Apply button on the Wellfound / AngelList job page to open the application form if it is not already visible",
  openFormRetryInstruction:
    "Click Apply or Continue until the Wellfound application form is visible",
}

export async function detectFields(
  ctx: PlatformAdapterContext
): Promise<DetectedField[]> {
  return detectApplicationFields(ctx, WELLFOUND_CONFIG)
}

export async function fillAndSubmit(input: FillAndSubmitInput) {
  return fillAndSubmitApplication(input, WELLFOUND_CONFIG)
}
