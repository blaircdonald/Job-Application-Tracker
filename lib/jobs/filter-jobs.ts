import { resolveJobDisplay } from "@/lib/jobs/display"
import { getPlatformConfig } from "@/lib/jobs/platforms"
import type { Job } from "@/lib/types/database"

export function filterJobs(jobs: Job[], query: string): Job[] {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return jobs

  const terms = normalizedQuery.split(/\s+/).filter(Boolean)

  return jobs.filter((job) => {
    const { title, company } = resolveJobDisplay(job)
    const platformName = getPlatformConfig(job.platform)?.name ?? job.platform

    const searchable = [
      title,
      company ?? "",
      job.location ?? "",
      job.salary ?? "",
      job.job_type ?? "",
      job.experience_level ?? "",
      platformName,
      ...job.tags,
    ]
      .join(" ")
      .toLowerCase()

    return terms.every((term) => searchable.includes(term))
  })
}
