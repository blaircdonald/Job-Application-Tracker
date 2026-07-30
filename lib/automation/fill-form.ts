import "server-only"

import { z } from "zod"

import type { DetectedField, FullProfile } from "@/lib/types/database"

import {
  buildProfileSummary,
  inferFallbackChoice,
  isChoiceField,
  isUserPromptField,
} from "@/lib/automation/field-inference"
import type { StagehandInstance } from "@/lib/automation/stagehand-client"

function buildTextFillPrompt(field: DetectedField, value: string) {
  return [
    `Fill the job application field labeled "${field.label}".`,
    `Enter this exact value: ${value}`,
    "Use the correct input, textarea, or autocomplete field.",
    "Do not use dropdown or radio controls for this text field.",
  ].join(" ")
}

function buildChoiceFillPrompt(field: DetectedField, value: string) {
  return [
    `Answer the job application question: "${field.label}"`,
    `Select the option that best matches: "${value}".`,
    "If this is a dropdown, open it and choose the matching option.",
    "If this is a radio button or checkbox group, click the matching choice.",
    "Do not type a sentence into a text box — pick from the provided options.",
  ].join(" ")
}

async function performFieldAct(
  stagehand: StagehandInstance,
  prompt: string,
  fallbackPrompt: string
) {
  try {
    await stagehand.act(prompt)
  } catch {
    await stagehand.act(fallbackPrompt)
  }
}

export async function fillSingleField(
  stagehand: StagehandInstance,
  field: DetectedField,
  value: string
) {
  const trimmed = value.trim()
  if (!trimmed) return

  if (isChoiceField(field) || isUserPromptField(field.label)) {
    const prompt = buildChoiceFillPrompt(field, trimmed)
    const fallback = [
      `Find the question "${field.label}" on the page.`,
      `Click "${trimmed}" if shown as a radio, checkbox, or dropdown option.`,
      "If options use different wording, pick the closest equivalent.",
    ].join(" ")

    await performFieldAct(stagehand, prompt, fallback)
    return
  }

  if (field.type === "textarea") {
    const prompt = [
      `In the "${field.label}" text area, enter:`,
      trimmed,
    ].join(" ")
    await performFieldAct(
      stagehand,
      prompt,
      `Type the following into the "${field.label}" field: ${trimmed}`
    )
    return
  }

  const prompt = buildTextFillPrompt(field, trimmed)
  await performFieldAct(
    stagehand,
    prompt,
    `Enter "${trimmed}" into the "${field.label}" input field.`
  )
}

export async function fillApplicationForm(
  stagehand: StagehandInstance,
  detectedFields: DetectedField[],
  mappedFields: Record<string, string>
) {
  const fieldById = new Map(detectedFields.map((field) => [field.id, field]))

  for (const [fieldId, value] of Object.entries(mappedFields)) {
    const field = fieldById.get(fieldId)
    if (!field) continue
    await fillSingleField(stagehand, field, value)
  }
}

export async function fillRemainingFieldsWithAgent(
  stagehand: StagehandInstance,
  profile: FullProfile,
  detectedFields: DetectedField[],
  mappedFields: Record<string, string>
) {
  const unfilledRequired = detectedFields.filter((field) => {
    if (!field.required) return false
    if (field.type === "file") return false
    return !mappedFields[field.id]?.trim()
  })

  if (unfilledRequired.length === 0) return

  const profileSummary = buildProfileSummary(profile)
  const fieldList = unfilledRequired
    .map((field) => `- ${field.label} (${field.type})`)
    .join("\n")

  await stagehand.act(
    [
      "Complete the remaining required fields on this job application form.",
      "Candidate profile:",
      profileSummary,
      "Remaining required fields:",
      fieldList,
      "Rules:",
      "- For sponsorship questions, select No unless the profile clearly indicates otherwise.",
      "- For work authorization questions, select Yes when reasonable based on the profile location.",
      "- For yes/no or multiple-choice questions, click the appropriate option — never type a job title into a dropdown.",
      "- For text fields, use accurate profile data.",
      "- Never leave a required field blank.",
      "- Skip fields that are already filled.",
    ].join("\n")
  )
}

export async function fillFallbackChoices(
  stagehand: StagehandInstance,
  detectedFields: DetectedField[],
  mappedFields: Record<string, string>
) {
  for (const field of detectedFields) {
    if (!field.required || field.type === "file") continue
    if (mappedFields[field.id]?.trim()) continue
    if (!isChoiceField(field) && !isUserPromptField(field.label)) continue

    const fallback = inferFallbackChoice(field.label)
    await fillSingleField(stagehand, field, fallback)
    mappedFields[field.id] = fallback
  }
}

export async function completeApplicationForm(
  stagehand: StagehandInstance,
  profile: FullProfile,
  detectedFields: DetectedField[],
  mappedFields: Record<string, string>
) {
  await fillApplicationForm(stagehand, detectedFields, mappedFields)
  await fillRemainingFieldsWithAgent(
    stagehand,
    profile,
    detectedFields,
    mappedFields
  )
  await fillFallbackChoices(stagehand, detectedFields, mappedFields)
}

export async function submitApplicationForm(stagehand: StagehandInstance) {
  await stagehand.act(
    [
      "Submit this job application.",
      "Click through any remaining Next or Continue buttons on multi-step forms.",
      "Then click the final Submit or Apply button.",
      "Do not leave required fields empty — if something blocks submission, fill it with the best available answer first.",
    ].join(" ")
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
