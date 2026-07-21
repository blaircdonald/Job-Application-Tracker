"use client"

import { JobCard } from "@/components/jobs/job-card"
import type { Job } from "@/lib/types/database"

type JobListProps = {
  jobs: Job[]
  onSavedChange?: (jobId: string, saved: boolean) => void
}

export function JobList({ jobs, onSavedChange }: JobListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Top job matches</h2>
          <p className="text-xs text-muted-foreground">
            Ranked by how well each role fits your profile
          </p>
        </div>
        <span className="text-xs text-muted-foreground">
          {jobs.length} {jobs.length === 1 ? "result" : "results"}
        </span>
      </div>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} onSavedChange={onSavedChange} />
        ))}
      </div>
    </div>
  )
}
