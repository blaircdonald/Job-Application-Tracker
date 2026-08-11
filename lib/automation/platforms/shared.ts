import "server-only"

import type { DetectedField } from "@/lib/types/database"
import {
  completeApplicationForm,
  ensureRequiredDropdownsFilled,
  submitApplicationForm,
  verifySubmission,
} from "@/lib/automation/fill-form"
import type {
  FillAndSubmitInput,
  PlatformAdapterContext,
} from "@/lib/automation/platforms/types"
import {
  extractFormFields,
  navigateToJob,
  uploadResume,
} from "@/lib/automation/platforms/types"

export type PlatformApplyConfig = {
  /** Instruction used to open the application form before detect/fill. */
  openFormInstruction: string
  /** Fallback if the first pass does not find core apply fields. */
  openFormRetryInstruction?: string
}

async function openApplicationForm(
  stagehand: PlatformAdapterContext["stagehand"],
  config: PlatformApplyConfig
) {
  await stagehand.act(config.openFormInstruction)
}

function hasCoreApplyFields(fields: DetectedField[]) {
  return fields.some((field) => /name|email|resume|phone|cv/i.test(field.label))
}

export async function detectApplicationFields(
  ctx: PlatformAdapterContext,
  config: PlatformApplyConfig
): Promise<DetectedField[]> {
  await navigateToJob(ctx.stagehand, ctx.jobUrl)
  await openApplicationForm(ctx.stagehand, config)

  const fields = await extractFormFields(ctx.stagehand)
  if (hasCoreApplyFields(fields)) {
    return fields
  }

  await ctx.stagehand.act(
    config.openFormRetryInstruction ??
      "Click through any Apply or Start Application buttons until the main application form is visible"
  )
  return extractFormFields(ctx.stagehand)
}

export async function fillAndSubmitApplication(
  input: FillAndSubmitInput,
  config: PlatformApplyConfig
) {
  await navigateToJob(input.stagehand, input.jobUrl)
  await openApplicationForm(input.stagehand, config)

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

  await ensureRequiredDropdownsFilled(input.stagehand, input.detectedFields)
  await submitApplicationForm(input.stagehand)
  await verifySubmission(input.stagehand)
}
