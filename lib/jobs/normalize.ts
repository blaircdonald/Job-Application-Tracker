import type { JobPlatform } from "@/lib/types/database"

import type { BraveWebResult } from "./brave-search"
import { isLikelyRemovedJob } from "./filter-removed-jobs"
import { calculateMatchScore } from "./match-score"
import { parseJobMetadata } from "./parse-job-metadata"
import type { JobSearchContext } from "./search-context"

export type NormalizedJob = {
  platform: JobPlatform
  title: string
  company: string | null
  company_logo: string | null
  location: string | null
  salary: string | null
  job_type: string | null
  experience_level: string | null
  description: string | null
  tags: string[]
  match_score: number
  job_url: string
  source_url: string
  posted_at: string | null
}

const SALARY_PATTERN =
  /\$[\d,]+(?:k|K)?(?:\s*[-–—to]+\s*\$?[\d,]+(?:k|K)?)?(?:\s*(?:\/\s*(?:yr|year|hour|hr|mo|month)))?/g

const EXPERIENCE_LEVELS = [
  "intern",
  "junior",
  "mid-level",
  "mid level",
  "senior",
  "staff",
  "principal",
  "lead",
  "director",
  "entry level",
  "entry-level",
]

const JOB_TYPES = [
  "internship",
  "intern",
  "co-op",
  "remote",
  "hybrid",
  "on-site",
  "onsite",
  "in-office",
  "full-time",
  "part-time",
  "contract",
]

function extractLocation(text: string): string | null {
  const patterns = [
    /(?:location|based in|office in)[:\s]+([^|.\n]+)/i,
    /\b(Remote(?:,\s*[A-Za-z\s]+)?|Hybrid(?:,\s*[A-Za-z\s]+)?)\b/i,
    /\b([A-Z][a-z]+(?:,\s*[A-Z]{2})?(?:,\s*(?:USA|US|United States))?)\b/,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]?.trim()) return match[1].trim()
  }

  return null
}

function extractSalary(text: string): string | null {
  const matches = text.match(SALARY_PATTERN)
  return matches?.[0] ?? null
}

function extractExperienceLevel(text: string): string | null {
  const lower = text.toLowerCase()
  for (const level of EXPERIENCE_LEVELS) {
    if (lower.includes(level)) {
      return level
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-")
    }
  }
  return null
}

function extractJobType(text: string, context: JobSearchContext): string | null {
  const lower = text.toLowerCase()
  for (const type of JOB_TYPES) {
    if (lower.includes(type)) {
      if (type === "intern") return "Internship"
      if (type === "co-op") return "Internship"
      return type
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join("-")
    }
  }

  switch (context.employmentType) {
    case "internship":
      return "Internship"
    case "part-time":
      return "Part-Time"
    case "full-time":
    default:
      return "Full-Time"
  }
}

function extractTags(text: string, context: JobSearchContext): string[] {
  const lower = text.toLowerCase()
  const candidates = unique([
    ...context.skills,
    ...context.techStack,
    "React",
    "TypeScript",
    "JavaScript",
    "Node.js",
    "Python",
    "AWS",
    "Remote",
  ])

  return candidates
    .filter((tag) => lower.includes(tag.toLowerCase()))
    .slice(0, 6)
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function getCompanyLogo(url: string, company: string | null): string | null {
  try {
    const hostname = new URL(url).hostname
    if (company) {
      const companySlug = company.toLowerCase().replace(/\s+/g, "")
      return `https://www.google.com/s2/favicons?domain=${companySlug}.com&sz=128`
    }
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`
  } catch {
    return null
  }
}

export function normalizeBraveResult(
  result: BraveWebResult,
  platform: JobPlatform,
  context: JobSearchContext
): NormalizedJob {
  const metadata = parseJobMetadata(result, platform)
  const description = result.description.trim() || null
  const combinedText = `${result.title} ${result.description}`

  const normalized: NormalizedJob = {
    platform,
    title: metadata.title,
    company: metadata.company,
    company_logo: getCompanyLogo(result.url, metadata.company),
    location: extractLocation(combinedText),
    salary: extractSalary(combinedText),
    job_type: extractJobType(combinedText, context),
    experience_level: extractExperienceLevel(combinedText),
    description,
    tags: extractTags(combinedText, context),
    match_score: 0,
    job_url: result.url,
    source_url: result.url,
    posted_at: metadata.postedAt,
  }

  normalized.match_score = calculateMatchScore(normalized, context)
  return normalized
}

export function normalizeBraveResults(
  results: BraveWebResult[],
  platform: JobPlatform,
  context: JobSearchContext
): NormalizedJob[] {
  const seen = new Set<string>()

  return results
    .map((result) => normalizeBraveResult(result, platform, context))
    .filter((job) => {
      if (seen.has(job.job_url)) return false
      seen.add(job.job_url)
      if (job.title.length < 2) return false
      return !isLikelyRemovedJob({
        title: job.title,
        description: job.description ?? "",
        url: job.job_url,
      })
    })
}
