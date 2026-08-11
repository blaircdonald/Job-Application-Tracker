import type {
  DetectedField,
  FullProfile,
  MissingField,
  ProfileSectionId,
} from "@/lib/types/database"
import {
  getUserPromptProfileKey,
  inferChoiceDefault,
  inferFallbackChoice,
  isChoiceField,
  isLikelyDropdownLabel,
  isUserPromptField,
} from "@/lib/automation/field-inference"
import { fullProfileToFormData } from "@/lib/profile/save-parsed-data"

type FieldPattern = {
  pattern: RegExp
  profileKey: string
  profileSection: ProfileSectionId
  getValue: (profile: FullProfile, formData: ReturnType<typeof fullProfileToFormData>) => string | null
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim())
}

export function splitFullName(fullName: string | null | undefined) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean)
  return {
    firstName: parts[0] ?? "",
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
  }
}

const FIELD_PATTERNS: FieldPattern[] = [
  {
    pattern: /first\s*name|given\s*name|fname/i,
    profileKey: "firstName",
    profileSection: "personal",
    getValue: (profile) => splitFullName(profile.profile.full_name).firstName,
  },
  {
    pattern: /last\s*name|family\s*name|surname|lname/i,
    profileKey: "lastName",
    profileSection: "personal",
    getValue: (profile) => splitFullName(profile.profile.full_name).lastName,
  },
  {
    pattern: /full\s*name|^name$|your\s*name/i,
    profileKey: "fullName",
    profileSection: "personal",
    getValue: (profile) => profile.profile.full_name,
  },
  {
    pattern: /e-?mail/i,
    profileKey: "email",
    profileSection: "personal",
    getValue: (profile) => profile.profile.email,
  },
  {
    pattern: /phone|mobile|telephone|cell/i,
    profileKey: "phone",
    profileSection: "personal",
    getValue: (profile) => profile.profile.phone,
  },
  {
    pattern: /location|city|address|where\s*are\s*you/i,
    profileKey: "location",
    profileSection: "personal",
    getValue: (profile) => profile.profile.location,
  },
  {
    pattern: /linkedin/i,
    profileKey: "linkedinUrl",
    profileSection: "links",
    getValue: (profile) => profile.profile.linkedin_url,
  },
  {
    pattern: /github/i,
    profileKey: "githubUrl",
    profileSection: "links",
    getValue: (profile) => profile.profile.github_url,
  },
  {
    pattern: /portfolio|personal\s*site|website|url/i,
    profileKey: "websiteUrl",
    profileSection: "links",
    getValue: (profile) => profile.profile.website_url,
  },
  {
    pattern: /summary|about|cover\s*letter|why\s*are\s*you/i,
    profileKey: "professionalSummary",
    profileSection: "summary",
    getValue: (profile) => profile.profile.professional_summary,
  },
  {
    pattern: /resume|cv|curriculum/i,
    profileKey: "resume",
    profileSection: "resume",
    getValue: () => null,
  },
  {
    pattern: /current\s*(?:company|employer)|employer\s*name|company\s*name|most\s*recent\s*company/i,
    profileKey: "workExperience",
    profileSection: "experience",
    getValue: (profile) =>
      profile.workExperiences[0]?.company
        ? `${profile.workExperiences[0].title} at ${profile.workExperiences[0].company}`
        : null,
  },
  {
    pattern: /education|school|university|degree|college/i,
    profileKey: "education",
    profileSection: "education",
    getValue: (profile) => profile.education[0]?.institution ?? null,
  },
]

function matchFieldPattern(label: string): FieldPattern | null {
  for (const pattern of FIELD_PATTERNS) {
    if (pattern.pattern.test(label)) {
      return pattern
    }
  }
  return null
}

export type FieldMappingResult = {
  mapped: Record<string, string>
  missing: MissingField[]
}

function buildMissingField(
  field: DetectedField,
  profileKey: string,
  profileSection: ProfileSectionId
): MissingField {
  return {
    fieldId: field.id,
    label: field.label,
    profileKey,
    profileSection,
    fieldType: field.type,
  }
}

export function mapFieldsToProfile(
  detectedFields: DetectedField[],
  profile: FullProfile,
  hasResume: boolean,
  supplementalFieldValues: Record<string, string> = {}
): FieldMappingResult {
  const formData = fullProfileToFormData(profile)
  const mapped: Record<string, string> = {}
  const missing: MissingField[] = []
  const seenKeys = new Set<string>()

  for (const field of detectedFields) {
    if (!field.required) continue

    if (isUserPromptField(field.label)) {
      const profileKey =
        getUserPromptProfileKey(field.label) ?? field.id
      const choiceValue = inferChoiceDefault(
        field.label,
        supplementalFieldValues,
        profileKey,
        field.id
      )

      if (choiceValue) {
        mapped[field.id] = choiceValue
        continue
      }

      missing.push(buildMissingField(field, profileKey, "personal"))
      continue
    }

    const pattern = matchFieldPattern(field.label)

    if (field.type === "file" && /resume|cv|curriculum/i.test(field.label)) {
      if (!hasResume) {
        missing.push(buildMissingField(field, "resume", "resume"))
      }
      continue
    }

    if (!pattern) {
      if (field.type !== "file") {
        const supplemental = supplementalFieldValues[field.id]?.trim()
        if (supplemental) {
          mapped[field.id] = supplemental
          continue
        }

        const treatAsChoice =
          field.type === "select" ||
          isChoiceField(field) ||
          isLikelyDropdownLabel(field.label)

        if (treatAsChoice) {
          if (
            /gender|sex|pronoun|race|ethnicity|veteran|disability|hear\s*about|how\s*did\s*you|source|referral/i.test(
              field.label
            )
          ) {
            mapped[field.id] = inferFallbackChoice(field.label)
            continue
          }

          if (/country/i.test(field.label)) {
            const location = profile.profile.location ?? ""
            mapped[field.id] = /united states|\busa\b|\bus\b/i.test(location)
              ? "United States"
              : inferFallbackChoice(field.label)
            continue
          }
        }

        missing.push(buildMissingField(field, field.id, "personal"))
      }
      continue
    }

    if (seenKeys.has(pattern.profileKey)) continue
    seenKeys.add(pattern.profileKey)

    if (pattern.profileKey === "resume") {
      if (!hasResume) {
        missing.push(buildMissingField(field, "resume", "resume"))
      }
      continue
    }

    const value = pattern.getValue(profile, formData)
    const supplemental = supplementalFieldValues[field.id]?.trim()

    if (supplemental) {
      mapped[field.id] = supplemental
      continue
    }

    if (!hasText(value)) {
      missing.push(
        buildMissingField(
          field,
          pattern.profileKey,
          pattern.profileSection
        )
      )
      continue
    }

    mapped[field.id] = value!.trim()
  }

  return { mapped, missing }
}

export function profileHasResume(profile: FullProfile, resumes: { parse_status: string }[]) {
  return resumes.some((resume) => resume.parse_status === "parsed")
}

export function getProfileValueForKey(
  profile: FullProfile,
  profileKey: string
): string | null {
  const formData = fullProfileToFormData(profile)
  const { firstName, lastName } = splitFullName(profile.profile.full_name)

  switch (profileKey) {
    case "firstName":
      return firstName || null
    case "lastName":
      return lastName || null
    case "fullName":
      return profile.profile.full_name
    case "email":
      return profile.profile.email
    case "phone":
      return profile.profile.phone
    case "location":
      return profile.profile.location
    case "linkedinUrl":
      return profile.profile.linkedin_url
    case "githubUrl":
      return profile.profile.github_url
    case "websiteUrl":
      return profile.profile.website_url
    case "professionalSummary":
      return profile.profile.professional_summary
    case "workExperience":
      return profile.workExperiences[0]
        ? `${profile.workExperiences[0].title} at ${profile.workExperiences[0].company}`
        : null
    case "education":
      return profile.education[0]?.institution ?? null
    default:
      if (profileKey in formData) {
        const value = formData[profileKey as keyof typeof formData]
        return typeof value === "string" ? value : null
      }
      return null
  }
}
