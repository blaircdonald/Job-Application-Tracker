import type { NormalizedJob } from "./normalize"
import type { JobSearchContext } from "./search-context"

function employmentTypeAliases(employmentType: JobSearchContext["employmentType"]) {
  switch (employmentType) {
    case "internship":
      return ["internship", "intern", "co-op", "coop", "co op"]
    case "part-time":
      return ["part-time", "part time", "parttime"]
    case "full-time":
    default:
      return ["full-time", "full time", "fulltime"]
  }
}

export function calculateMatchScore(
  job: Pick<
    NormalizedJob,
    "title" | "description" | "tags" | "location" | "job_type" | "experience_level"
  >,
  context: JobSearchContext
): number {
  const searchableText = [
    job.title,
    job.description ?? "",
    job.tags.join(" "),
    job.location ?? "",
    job.job_type ?? "",
    job.experience_level ?? "",
  ]
    .join(" ")
    .toLowerCase()

  let score = 25

  for (const skill of context.skills) {
    if (searchableText.includes(skill.toLowerCase())) {
      score += 6
    }
  }

  for (const tech of context.techStack) {
    if (searchableText.includes(tech.toLowerCase())) {
      score += 8
    }
  }

  for (const keyword of context.summaryKeywords) {
    if (searchableText.includes(keyword.toLowerCase())) {
      score += 3
    }
  }

  const roleWords = context.role
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)

  const roleMatches = roleWords.filter((word) =>
    searchableText.includes(word)
  ).length

  if (roleMatches > 0) {
    score += Math.min(20, roleMatches * 5)
  }

  if (context.location) {
    const locationPart = context.location.split(",")[0]?.trim().toLowerCase()
    if (locationPart && searchableText.includes(locationPart)) {
      score += 10
    }
  }

  if (
    context.workArrangement &&
    searchableText.includes(context.workArrangement.toLowerCase())
  ) {
    score += 6
  }

  const employmentAliases = employmentTypeAliases(context.employmentType)
  const employmentMatch = employmentAliases.some((alias) =>
    searchableText.includes(alias)
  )

  if (employmentMatch) {
    score += 14
  } else if (context.employmentType === "internship") {
    // Internships should not rank highly if the listing looks like senior FT
    if (
      /\b(senior|staff|principal|director|lead)\b/i.test(searchableText) &&
      !/\b(intern|internship)\b/i.test(searchableText)
    ) {
      score -= 15
    }
  }

  if (job.tags.length >= 3) {
    score += 5
  }

  return Math.min(100, Math.max(15, Math.round(score)))
}
