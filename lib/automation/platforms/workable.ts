import type { DetectedField } from "@/lib/types/database"
import type {
  FillAndSubmitInput,
  PlatformAdapterContext,
} from "@/lib/automation/platforms/types"
import {
  fillAndSubmit as baseFillAndSubmit,
} from "@/lib/automation/platforms/greenhouse"
import { extractFormFields, navigateToJob } from "@/lib/automation/platforms/types"

export async function detectFields(
  ctx: PlatformAdapterContext
): Promise<DetectedField[]> {
  await navigateToJob(ctx.stagehand, ctx.jobUrl)
  await ctx.stagehand.act(
    "Click the Apply for this job button on the Workable application page"
  )
  return extractFormFields(ctx.stagehand)
}

export async function fillAndSubmit(input: FillAndSubmitInput) {
  return baseFillAndSubmit(input)
}
