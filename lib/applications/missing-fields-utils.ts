import type { MissingField } from "@/lib/types/database"

const PROFILE_KEYS = new Set([
  "firstName",
  "lastName",
  "fullName",
  "email",
  "phone",
  "location",
  "linkedinUrl",
  "githubUrl",
  "websiteUrl",
  "professionalSummary",
  "workExperience",
  "education",
  "resume",
  "requiresSponsorship",
  "authorizedToWork",
])

export function buildApplicationFieldValues(
  existingValues: Record<string, string>,
  missingFields: MissingField[],
  values: Record<string, string>
): Record<string, string> {
  const merged = { ...existingValues }

  for (const field of missingFields) {
    const value = values[field.fieldId]?.trim()
    if (!value || field.profileKey === "resume") continue
    merged[field.fieldId] = value
    merged[field.profileKey] = value
  }

  return merged
}

export function isKnownProfileKey(profileKey: string) {
  return PROFILE_KEYS.has(profileKey)
}

export function getFillableMissingFields(missingFields: MissingField[]) {
  return missingFields.filter((field) => field.profileKey !== "resume")
}
