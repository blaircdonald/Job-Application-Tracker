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
  mappedFields: Record<string, string>
  resumeFilePath: string | null
}

export interface PlatformAdapter {
  platform: string
  detectFields(ctx: PlatformAdapterContext): Promise<DetectedField[]>
  fillAndSubmit(input: FillAndSubmitInput): Promise<void>
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
  await stagehand.act("dismiss any cookie consent or popup banners if visible")
}

export async function extractFormFields(
  stagehand: StagehandInstance
): Promise<DetectedField[]> {
  const result = await stagehand.extract(
    "Extract all visible form input fields on this job application page. Include labels, field types, and whether each field appears required. Include file upload fields for resume/CV.",
    detectedFieldsSchema
  )

  return result.fields.map((field, index) => ({
    id: field.id || `field-${index + 1}`,
    label: field.label,
    type: field.type,
    required: field.required,
  }))
}

export async function fillMappedFields(
  stagehand: StagehandInstance,
  mappedFields: Record<string, string>
) {
  for (const [fieldId, value] of Object.entries(mappedFields)) {
    if (!value.trim()) continue
    await stagehand.act(`Fill the form field "${fieldId}" with the value: ${value}`)
  }
}

export async function uploadResume(
  stagehand: StagehandInstance,
  resumeFilePath: string
) {
  await stagehand.act(
    `Upload the resume file from local path ${resumeFilePath} to the resume or CV file input field`
  )
}

export async function submitApplicationForm(stagehand: StagehandInstance) {
  await stagehand.act(
    "Click the submit or apply button to submit the job application form. If there is a Next button on a multi-step form, click through all steps until the final submit."
  )
}

export async function verifySubmission(stagehand: StagehandInstance) {
  const result = await stagehand.extract(
    "Did the job application submit successfully? Look for confirmation messages, thank you pages, or success indicators.",
    z.object({
      submitted: z.boolean(),
      message: z.string().optional(),
    })
  )

  if (!result.submitted) {
    throw new Error(result.message ?? "Application submission could not be verified")
  }
}

export type { FieldMappingResult }
