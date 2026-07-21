import type { NormalizedJob } from "./normalize"
import type { JobSearchContext } from "./search-context"

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
    context.jobType &&
    job.job_type?.toLowerCase().includes(context.jobType.toLowerCase())
  ) {
    score += 10
  }

  if (job.tags.length >= 3) {
    score += 5
  }

  return Math.min(100, Math.max(20, Math.round(score)))
}
