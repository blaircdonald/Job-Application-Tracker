import type {
  EmploymentType,
  JobPlatform,
  ProfileFormData,
} from "@/lib/types/database"

import { buildPlatformSiteClause } from "@/lib/jobs/platforms"

export type JobSearchContext = {
  role: string
  techStack: string[]
  skills: string[]
  location: string
  /** Remote / Hybrid / On-site preference inferred from profile location */
  workArrangement: string
  /** User-selected employment type for search */
  employmentType: EmploymentType
  experienceYears: number
  educationFields: string[]
  summaryKeywords: string[]
}

export const DEFAULT_EMPLOYMENT_TYPE: EmploymentType = "full-time"

export const EMPLOYMENT_TYPE_OPTIONS: Array<{
  id: EmploymentType
  label: string
  description: string
}> = [
  {
    id: "full-time",
    label: "Full-time",
    description: "Permanent full-time roles",
  },
  {
    id: "part-time",
    label: "Part-time",
    description: "Part-time and flexible roles",
  },
  {
    id: "internship",
    label: "Internship",
    description: "Intern and co-op opportunities",
  },
]

function uniqueNonEmpty(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function quoteIfNeeded(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return trimmed.includes(" ") ? `"${trimmed}"` : trimmed
}

function inferRole(data: ProfileFormData): string {
  const current = data.workExperiences.find((item) => item.isCurrent)
  if (current?.title?.trim()) return current.title.trim()

  const latest = data.workExperiences.find((item) => item.title.trim())
  if (latest) return latest.title.trim()

  if (data.skills.length > 0) {
    return `${data.skills.slice(0, 2).join(" ")} Developer`
  }

  return "Software Engineer"
}

function inferWorkArrangement(data: ProfileFormData): string {
  const location = data.location.toLowerCase()
  if (location.includes("hybrid")) return "Hybrid"
  if (location.includes("on-site") || location.includes("onsite")) return "On-site"
  if (location.includes("remote")) return "Remote"
  return "Remote"
}

function inferExperienceYears(data: ProfileFormData): number {
  const currentRoles = data.workExperiences.filter((item) => item.isCurrent).length
  const totalRoles = data.workExperiences.length

  if (currentRoles > 0) return Math.min(10, totalRoles + 2)
  return Math.max(0, totalRoles)
}

function extractSummaryKeywords(summary: string): string[] {
  const stopWords = new Set([
    "with",
    "from",
    "that",
    "this",
    "have",
    "been",
    "using",
    "years",
    "year",
    "experience",
    "experienced",
    "professional",
    "looking",
    "seeking",
    "passionate",
    "about",
    "and",
    "the",
    "for",
    "into",
  ])

  return uniqueNonEmpty(
    summary
      .split(/[^a-zA-Z0-9+#.]+/)
      .filter((word) => word.length > 2 && !stopWords.has(word.toLowerCase()))
  ).slice(0, 6)
}

function getPrimaryLocationTerm(location: string): string {
  const trimmed = location.trim()
  if (!trimmed) return ""

  const lower = trimmed.toLowerCase()
  if (lower === "remote" || lower === "united states" || lower.includes("remote")) {
    return ""
  }

  const city = trimmed.split(",")[0]?.trim()
  return city ? quoteIfNeeded(city) : ""
}

function employmentTypeQueryTerm(employmentType: EmploymentType): string {
  switch (employmentType) {
    case "internship":
      return "internship OR intern OR \"co-op\" OR coop"
    case "part-time":
      return "\"part-time\" OR \"part time\""
    case "full-time":
    default:
      return "\"full-time\" OR \"full time\""
  }
}

function seniorityQueryTerm(experienceYears: number, employmentType: EmploymentType): string {
  if (employmentType === "internship") return "intern OR internship OR \"entry level\""
  if (experienceYears <= 1) return "\"entry level\" OR junior OR associate"
  if (experienceYears >= 6) return "senior OR staff OR lead"
  return ""
}

export function buildJobSearchContext(
  data: ProfileFormData,
  employmentType: EmploymentType = DEFAULT_EMPLOYMENT_TYPE
): JobSearchContext {
  const projectTech = data.projects.flatMap((project) => project.technologies)
  const techStack = uniqueNonEmpty([...data.skills, ...projectTech])

  return {
    role: inferRole(data),
    techStack: techStack.slice(0, 8),
    skills: uniqueNonEmpty(data.skills).slice(0, 12),
    location: data.location.trim() || "United States",
    workArrangement: inferWorkArrangement(data),
    employmentType,
    experienceYears: inferExperienceYears(data),
    educationFields: uniqueNonEmpty(
      data.education.map((item) => item.fieldOfStudy || item.degree || "")
    ).slice(0, 3),
    summaryKeywords: extractSummaryKeywords(data.professionalSummary ?? ""),
  }
}

function joinQueryTerms(terms: string[]) {
  return uniqueNonEmpty(terms).join(" ")
}

export function buildPlatformSearchQueries(
  platform: JobPlatform,
  context: JobSearchContext
): string[] {
  const siteClause = buildPlatformSiteClause(platform)
  const rolePhrase = quoteIfNeeded(context.role)
  const keywords = uniqueNonEmpty([
    ...context.techStack.slice(0, 3),
    ...context.skills.slice(0, 3),
    ...context.summaryKeywords.slice(0, 2),
  ]).slice(0, 4)
  const locationTerm = getPrimaryLocationTerm(context.location)
  const employmentTerm = `(${employmentTypeQueryTerm(context.employmentType)})`
  const seniority = seniorityQueryTerm(
    context.experienceYears,
    context.employmentType
  )
  const educationTerm =
    context.employmentType === "internship" && context.educationFields[0]
      ? quoteIfNeeded(context.educationFields[0])
      : ""
  const workArrangement = quoteIfNeeded(context.workArrangement)

  const queries = [
    joinQueryTerms([
      siteClause,
      rolePhrase,
      ...keywords.slice(0, 3).map(quoteIfNeeded),
      employmentTerm,
      seniority,
      educationTerm,
      locationTerm,
    ]),
    joinQueryTerms([
      siteClause,
      rolePhrase,
      ...keywords.slice(0, 2).map(quoteIfNeeded),
      employmentTerm,
      workArrangement,
    ]),
    joinQueryTerms([
      siteClause,
      rolePhrase,
      employmentTerm,
      seniority,
      locationTerm,
    ]),
    joinQueryTerms([
      siteClause,
      keywords[0]
        ? quoteIfNeeded(`${keywords[0]} ${context.role.split(" ").slice(-1)[0] || "Engineer"}`)
        : rolePhrase || '"Software Engineer"',
      employmentTerm,
    ]),
    joinQueryTerms([
      siteClause,
      rolePhrase || '"Software Engineer"',
      employmentTerm,
      "jobs",
    ]),
  ]

  return [...new Set(queries.filter(Boolean))]
}

export function buildPlatformSearchQuery(
  platform: JobPlatform,
  context: JobSearchContext
): string {
  return buildPlatformSearchQueries(platform, context)[0]
}
