import type { JobPlatform, ProfileFormData } from "@/lib/types/database"

import { buildPlatformSiteClause } from "@/lib/jobs/platforms"

export type JobSearchContext = {
  role: string
  techStack: string[]
  skills: string[]
  location: string
  jobType: string
  experienceYears: number
  educationFields: string[]
}

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

function inferJobType(data: ProfileFormData): string {
  const location = data.location.toLowerCase()
  if (location.includes("remote")) return "Remote"
  if (location.includes("hybrid")) return "Hybrid"
  return "Remote"
}

function inferExperienceYears(data: ProfileFormData): number {
  const currentRoles = data.workExperiences.filter((item) => item.isCurrent).length
  const totalRoles = data.workExperiences.length

  if (currentRoles > 0) return Math.min(10, totalRoles + 2)
  return Math.max(1, totalRoles)
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

export function buildJobSearchContext(
  data: ProfileFormData
): JobSearchContext {
  const projectTech = data.projects.flatMap((project) => project.technologies)
  const techStack = uniqueNonEmpty([...data.skills, ...projectTech])

  return {
    role: inferRole(data),
    techStack: techStack.slice(0, 5),
    skills: uniqueNonEmpty(data.skills),
    location: data.location.trim() || "United States",
    jobType: inferJobType(data),
    experienceYears: inferExperienceYears(data),
    educationFields: uniqueNonEmpty(
      data.education.map((item) => item.fieldOfStudy || item.degree || "")
    ),
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
    ...context.techStack.slice(0, 2),
    ...context.skills.slice(0, 2),
  ]).slice(0, 2)
  const locationTerm = getPrimaryLocationTerm(context.location)
  const jobType = quoteIfNeeded(context.jobType)

  const queries = [
    joinQueryTerms([siteClause, rolePhrase, ...keywords, jobType, locationTerm]),
    joinQueryTerms([siteClause, rolePhrase, ...keywords, jobType]),
    joinQueryTerms([siteClause, rolePhrase, jobType]),
    joinQueryTerms([
      siteClause,
      keywords[0] ? quoteIfNeeded(`${keywords[0]} Developer`) : '"Software Engineer"',
      jobType,
    ]),
    joinQueryTerms([siteClause, rolePhrase || '"Software Engineer"', "jobs"]),
  ]

  return [...new Set(queries.filter(Boolean))]
}

export function buildPlatformSearchQuery(
  platform: JobPlatform,
  context: JobSearchContext
): string {
  return buildPlatformSearchQueries(platform, context)[0]
}
