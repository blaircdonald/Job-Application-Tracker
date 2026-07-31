"use client"

import { RefreshCw } from "lucide-react"

import { JobCard } from "@/components/jobs/job-card"
import { Button } from "@/components/ui/button"
import type { Job } from "@/lib/types/database"

type JobListProps = {
  jobs: Job[]
  onSavedChange?: (jobId: string, saved: boolean) => void
  onAppliedChange?: (jobId: string) => void
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function JobList({
  jobs,
  onSavedChange,
  onAppliedChange,
  onRefresh,
  isRefreshing = false,
}: JobListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Top job matches</h2>
          <p className="text-xs text-muted-foreground">
            Ranked by how well each role fits your profile
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {jobs.length} {jobs.length === 1 ? "result" : "results"}
          </span>
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              onClick={onRefresh}
            >
              <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
              Refresh matches
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onSavedChange={onSavedChange}
            onAppliedChange={onAppliedChange}
          />
        ))}
      </div>
    </div>
  )
}
