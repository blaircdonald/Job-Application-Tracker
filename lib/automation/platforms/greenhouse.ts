import type { DetectedField } from "@/lib/types/database"
import type {
  FillAndSubmitInput,
  PlatformAdapterContext,
} from "@/lib/automation/platforms/types"
import {
  completeApplicationForm,
  submitApplicationForm,
  verifySubmission,
} from "@/lib/automation/fill-form"
import {
  extractFormFields,
  navigateToJob,
  uploadResume,
} from "@/lib/automation/platforms/types"

async function clickApplyButton(stagehand: PlatformAdapterContext["stagehand"]) {
  await stagehand.act(
    "Click the Apply or Submit Application button to open the application form if it is not already visible"
  )
}

export async function detectFields(
  ctx: PlatformAdapterContext
): Promise<DetectedField[]> {
  await navigateToJob(ctx.stagehand, ctx.jobUrl)
  await clickApplyButton(ctx.stagehand)

  const fields = await extractFormFields(ctx.stagehand)

  const hasApplyFields = fields.some((field) =>
    /name|email|resume|phone/i.test(field.label)
  )

  if (!hasApplyFields) {
    await ctx.stagehand.act(
      "Click through any Apply or Start Application buttons until the main application form is visible"
    )
    return extractFormFields(ctx.stagehand)
  }

  return fields
}

export async function fillAndSubmit(input: FillAndSubmitInput) {
  await navigateToJob(input.stagehand, input.jobUrl)
  await clickApplyButton(input.stagehand)

  const mappedFields = { ...input.mappedFields }

  await completeApplicationForm(
    input.stagehand,
    input.profile,
    input.detectedFields,
    mappedFields
  )

  if (input.resumeFilePath) {
    await uploadResume(input.stagehand, input.resumeFilePath)
  }

  await completeApplicationForm(
    input.stagehand,
    input.profile,
    input.detectedFields,
    mappedFields
  )

  await submitApplicationForm(input.stagehand)
  await verifySubmission(input.stagehand)
}
