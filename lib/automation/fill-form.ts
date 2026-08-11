import "server-only"

import { z } from "zod"

import type { DetectedField, FullProfile } from "@/lib/types/database"

import {
  buildProfileSummary,
  inferFallbackChoice,
  isChoiceField,
  isLikelyDropdownLabel,
  isUserPromptField,
} from "@/lib/automation/field-inference"
import type { StagehandInstance } from "@/lib/automation/stagehand-client"

function buildTextFillPrompt(field: DetectedField, value: string) {
  return [
    `Fill the job application field labeled "${field.label}".`,
    `Enter this exact value: ${value}`,
    "Use the correct input, textarea, or autocomplete field.",
  ].join(" ")
}

function buildChoiceFillPrompt(field: DetectedField, value: string) {
  return [
    `Answer the job application question: "${field.label}"`,
    `You MUST select a dropdown, combobox, radio, or checkbox option — do not skip this field.`,
    `Open the control if needed, then choose the option that best matches: "${value}".`,
    "If the exact option is not listed, pick the closest equivalent (for example Prefer not to say, Other, or Decline to answer).",
    "Do not type a free-form sentence into a text box when options are available.",
  ].join(" ")
}

async function performFieldAct(
  stagehand: StagehandInstance,
  prompts: string[]
) {
  let lastError: unknown

  for (const prompt of prompts) {
    try {
      await stagehand.act(prompt)
      return
    } catch (error) {
      lastError = error
    }
  }

  if (lastError) throw lastError
}

export async function fillSingleField(
  stagehand: StagehandInstance,
  field: DetectedField,
  value: string
) {
  const trimmed = value.trim()
  if (!trimmed) return

  const treatAsChoice =
    isChoiceField(field) ||
    isUserPromptField(field.label) ||
    isLikelyDropdownLabel(field.label) ||
    field.type === "select"

  if (treatAsChoice) {
    await performFieldAct(stagehand, [
      buildChoiceFillPrompt(field, trimmed),
      [
        `Find the question or field labeled "${field.label}".`,
        "If it is a dropdown or combobox, click it to open the options list.",
        `Then click the option that best matches "${trimmed}".`,
      ].join(" "),
      [
        `Open the "${field.label}" dropdown/select/combobox.`,
        `Select "${trimmed}" from the visible options.`,
        "If that exact text is missing, choose Prefer not to say, Other, or the closest match.",
      ].join(" "),
    ])
    return
  }

  if (field.type === "textarea") {
    await performFieldAct(stagehand, [
      `In the "${field.label}" text area, enter: ${trimmed}`,
      `Type the following into the "${field.label}" field: ${trimmed}`,
    ])
    return
  }

  await performFieldAct(stagehand, [
    buildTextFillPrompt(field, trimmed),
    `Enter "${trimmed}" into the "${field.label}" input field.`,
  ])
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

  const unfilledDropdowns = detectedFields.filter((field) => {
    if (field.type === "file") return false
    if (mappedFields[field.id]?.trim()) return false
    return (
      field.type === "select" ||
      isChoiceField(field) ||
      isLikelyDropdownLabel(field.label)
    )
  })

  const targets = [
    ...new Map(
      [...unfilledRequired, ...unfilledDropdowns].map((field) => [
        field.id,
        field,
      ])
    ).values(),
  ]

  if (targets.length === 0) return

  const profileSummary = buildProfileSummary(profile)
  const fieldList = targets
    .map((field) => `- ${field.label} (${field.type})`)
    .join("\n")

  await stagehand.act(
    [
      "Complete the remaining fields on this job application form.",
      "Candidate profile:",
      profileSummary,
      "Fields that still need answers (including dropdowns):",
      fieldList,
      "Rules:",
      "- Never skip a dropdown, combobox, select, or radio group in the list above.",
      "- For each dropdown: click to open it, then click an option.",
      "- For sponsorship questions, select No unless the profile clearly indicates otherwise.",
      "- For work authorization questions, select Yes when reasonable based on the profile location.",
      "- For demographic questions (gender, race, veteran, disability), choose Prefer not to say when available.",
      "- For Country, prefer United States when it fits the profile location.",
      "- For yes/no or multiple-choice questions, click the option — never type a job title into a dropdown.",
      "- For text fields, use accurate profile data.",
      "- Never leave a listed required field blank.",
    ].join("\n")
  )
}

export async function fillFallbackChoices(
  stagehand: StagehandInstance,
  detectedFields: DetectedField[],
  mappedFields: Record<string, string>
) {
  for (const field of detectedFields) {
    if (field.type === "file") continue
    if (mappedFields[field.id]?.trim()) continue

    const shouldFill =
      field.required ||
      field.type === "select" ||
      isChoiceField(field) ||
      isLikelyDropdownLabel(field.label)

    if (!shouldFill) continue

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
      "Before submitting, check every dropdown/select/combobox on the form.",
      "If any still show a placeholder like Select, Choose, or are empty, open them and pick a valid option.",
      "Then submit this job application.",
      "Click through any remaining Next or Continue buttons on multi-step forms.",
      "Then click the final Submit or Apply button.",
      "Do not leave required fields empty — if something blocks submission, fill it with the best available answer first.",
    ].join(" ")
  )
}

const emptyRequiredFieldsSchema = z.object({
  emptyLabels: z.array(z.string()),
})

export async function ensureRequiredDropdownsFilled(
  stagehand: StagehandInstance,
  detectedFields: DetectedField[]
) {
  const dropdownLabels = detectedFields
    .filter(
      (field) =>
        field.required &&
        (field.type === "select" ||
          isChoiceField(field) ||
          isLikelyDropdownLabel(field.label))
    )
    .map((field) => field.label)

  if (dropdownLabels.length === 0) return

  const result = await stagehand.extract(
    [
      "Inspect these application questions/fields and list any that still have no selected value",
      '(placeholder text like "Select...", "Choose...", or blank counts as empty):',
      dropdownLabels.map((label) => `- ${label}`).join("\n"),
    ].join("\n"),
    emptyRequiredFieldsSchema
  )

  for (const label of result.emptyLabels) {
    const field = detectedFields.find(
      (item) => item.label.toLowerCase() === label.toLowerCase()
    )
    const fallback = inferFallbackChoice(field?.label ?? label)
    await stagehand.act(
      [
        `The field "${label}" is still empty.`,
        "Open its dropdown/combobox/radio group and select a valid option.",
        `Prefer "${fallback}" if available, otherwise Prefer not to say / Other / the closest match.`,
      ].join(" ")
    )
  }
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
