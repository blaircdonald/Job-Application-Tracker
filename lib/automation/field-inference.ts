import type { DetectedField, FullProfile } from "@/lib/types/database"

export const USER_PROMPT_PROFILE_KEYS = {
  requiresSponsorship: "requiresSponsorship",
  authorizedToWork: "authorizedToWork",
} as const

export function isSponsorshipQuestion(label: string) {
  return /sponsorship|visa\s*sponsor|immigration\s*support|require.*sponsor|need.*sponsor/i.test(
    label
  )
}

export function isWorkAuthorizationQuestion(label: string) {
  return /authorized\s*to\s*work|legally\s*authorized|eligible\s*to\s*work|work\s*authorization|right\s*to\s*work|work\s*permit|country\s*of\s*residence/i.test(
    label
  )
}

export function isUserPromptField(label: string) {
  return isSponsorshipQuestion(label) || isWorkAuthorizationQuestion(label)
}

export function isYesNoQuestion(label: string) {
  return (
    /\b(yes|no)\b/i.test(label) &&
    /require|authorized|eligible|sponsorship|consent|agree|willing|currently|have\s*you|are\s*you|do\s*you|will\s*you/i.test(
      label
    )
  )
}

/** Labels that are almost always dropdowns / radio groups on ATS forms. */
export function isLikelyDropdownLabel(label: string) {
  return /country|state|province|region|gender|sex|pronoun|race|ethnicity|veteran|disability|hear\s*about|how\s*did\s*you|source|referral|education\s*level|degree\s*type|employment\s*(?:type|status)|job\s*type|work\s*(?:type|authorization)|visa|sponsorship|authorized\s*to\s*work|salary\s*(?:expectation|range)|notice\s*period|willing\s*to\s*relocate|remote|hybrid|preferred\s*location|timezone|availability|start\s*date|years?\s*of\s*experience|seniority|level|select\s*(?:one|an\s*option)|choose|dropdown|please\s*select/i.test(
    label
  )
}

export function isChoiceField(field: Pick<DetectedField, "label" | "type">) {
  return (
    field.type === "select" ||
    field.type === "checkbox" ||
    isYesNoQuestion(field.label) ||
    (field.type === "unknown" && isLikelyDropdownLabel(field.label))
  )
}

export function getUserPromptProfileKey(label: string): string | null {
  if (isSponsorshipQuestion(label)) {
    return USER_PROMPT_PROFILE_KEYS.requiresSponsorship
  }
  if (isWorkAuthorizationQuestion(label)) {
    return USER_PROMPT_PROFILE_KEYS.authorizedToWork
  }
  return null
}

export function inferChoiceDefault(
  label: string,
  supplementalValues: Record<string, string>,
  profileKey: string | null,
  fieldId?: string
): string | null {
  if (fieldId && supplementalValues[fieldId]?.trim()) {
    return supplementalValues[fieldId].trim()
  }

  if (profileKey && supplementalValues[profileKey]?.trim()) {
    return supplementalValues[profileKey].trim()
  }

  if (isSponsorshipQuestion(label)) {
    return supplementalValues[USER_PROMPT_PROFILE_KEYS.requiresSponsorship]?.trim() ?? null
  }

  if (isWorkAuthorizationQuestion(label)) {
    return (
      supplementalValues[USER_PROMPT_PROFILE_KEYS.authorizedToWork]?.trim() ?? null
    )
  }

  if (isYesNoQuestion(label)) {
    if (/authorized|eligible|legally|right\s*to\s*work/i.test(label)) {
      return "Yes"
    }
    if (/sponsorship|visa|sponsor/i.test(label)) {
      return "No"
    }
  }

  return null
}

export function inferFallbackChoice(label: string): string {
  if (isSponsorshipQuestion(label)) return "No"
  if (isWorkAuthorizationQuestion(label)) return "Yes"
  if (isYesNoQuestion(label)) {
    if (/authorized|eligible|legally|right\s*to\s*work/i.test(label)) return "Yes"
    if (/sponsorship|visa|sponsor/i.test(label)) return "No"
    if (/relocate|willing|remote|hybrid/i.test(label)) return "Yes"
    return "No"
  }
  if (/gender|sex|pronoun|race|ethnicity|veteran|disability/i.test(label)) {
    return "Prefer not to say"
  }
  if (/hear\s*about|how\s*did\s*you|source|referral/i.test(label)) {
    return "Other"
  }
  if (/country/i.test(label)) return "United States"
  if (/employment\s*(?:type|status)|job\s*type|work\s*type/i.test(label)) {
    return "Full-time"
  }
  return "Prefer not to say"
}

export function buildProfileSummary(profile: FullProfile): string {
  const lines = [
    profile.profile.full_name
      ? `Name: ${profile.profile.full_name}`
      : null,
    profile.profile.email ? `Email: ${profile.profile.email}` : null,
    profile.profile.phone ? `Phone: ${profile.profile.phone}` : null,
    profile.profile.location ? `Location: ${profile.profile.location}` : null,
    profile.profile.professional_summary
      ? `Summary: ${profile.profile.professional_summary.slice(0, 400)}`
      : null,
    profile.workExperiences[0]
      ? `Latest role: ${profile.workExperiences[0].title} at ${profile.workExperiences[0].company}`
      : null,
    profile.education[0]
      ? `Education: ${profile.education[0].institution}`
      : null,
    profile.skills.length > 0
      ? `Skills: ${profile.skills.slice(0, 12).map((s) => s.name).join(", ")}`
      : null,
  ].filter(Boolean)

  return lines.join("\n")
}

export function getFieldInputKind(field: { label: string; profileKey: string; fieldType?: DetectedField["type"] }) {
  if (isChoiceField({ label: field.label, type: field.fieldType ?? "unknown" })) {
    return "choice" as const
  }
  if (/summary|cover|about|why/i.test(field.label)) {
    return "textarea" as const
  }
  if (/e-?mail/i.test(field.label) || field.profileKey === "email") {
    return "email" as const
  }
  if (/phone|tel|mobile/i.test(field.label) || field.profileKey === "phone") {
    return "tel" as const
  }
  if (/url|linkedin|github|website|portfolio/i.test(field.label)) {
    return "url" as const
  }
  return "text" as const
}

export function getChoiceOptions(label: string): string[] {
  if (isSponsorshipQuestion(label) || isWorkAuthorizationQuestion(label) || isYesNoQuestion(label)) {
    return ["Yes", "No"]
  }
  return ["Yes", "No", "Not sure"]
}
