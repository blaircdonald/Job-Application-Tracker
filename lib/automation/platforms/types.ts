import { z } from "zod"

import type { DetectedField } from "@/lib/types/database"
import type { StagehandInstance } from "@/lib/automation/stagehand-client"
import type { FullProfile } from "@/lib/types/database"
import type { FieldMappingResult } from "@/lib/automation/map-fields"

export type PlatformAdapterContext = {
  stagehand: StagehandInstance
  jobUrl: string
}

export type FillAndSubmitInput = {
  stagehand: StagehandInstance
  jobUrl: string
  profile: FullProfile
  detectedFields: DetectedField[]
  mappedFields: Record<string, string>
  resumeFilePath: string | null
}

export interface PlatformAdapter {
  platform: string
  detectFields(ctx: PlatformAdapterContext): Promise<DetectedField[]>
  fillAndSubmit(input: FillAndSubmitInput): Promise<void>
}

export async function getActivePage(stagehand: StagehandInstance) {
  const page =
    stagehand.context.activePage() ?? stagehand.context.pages()[0]

  if (!page) {
    throw new Error("No browser page available in Stagehand session")
  }

  return page
}

export async function navigateToJob(
  stagehand: StagehandInstance,
  jobUrl: string
) {
  const page = await getActivePage(stagehand)
  await page.goto(jobUrl, { waitUntil: "domcontentloaded", timeoutMs: 60000 })
  try {
    await stagehand.act(
      "Dismiss any cookie consent or popup banners if visible. If none exist, do nothing."
    )
  } catch {
    // Cookie banners are optional.
  }
}

const detectedFieldsSchema = z.object({
  fields: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      type: z.enum([
        "text",
        "email",
        "tel",
        "file",
        "select",
        "textarea",
        "checkbox",
        "unknown",
      ]),
      required: z.boolean(),
    })
  ),
})

export async function extractFormFields(
  stagehand: StagehandInstance
): Promise<DetectedField[]> {
  const result = await stagehand.extract(
    [
      "Extract all visible form fields on this job application page.",
      "Include text inputs, textareas, dropdowns/selects, radio groups, checkboxes, and file uploads.",
      "For each field include the visible label/question text, field type, and whether it appears required.",
    ].join(" "),
    detectedFieldsSchema
  )

  return result.fields.map((field, index) => ({
    id: field.id || `field-${index + 1}`,
    label: field.label,
    type: field.type,
    required: field.required,
  }))
}

export async function uploadResume(
  stagehand: StagehandInstance,
  resumeFilePath: string
) {
  await stagehand.act(
    `Upload the resume file from local path ${resumeFilePath} to the resume or CV file input field`
  )
}

export type { FieldMappingResult }
