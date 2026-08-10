"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { JobCard } from "@/components/jobs/job-card"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { JobWithApplicationStatus } from "@/lib/types/database"

type SavedJobsListProps = {
  initialJobs: JobWithApplicationStatus[]
}

export function SavedJobsList({ initialJobs }: SavedJobsListProps) {
  const router = useRouter()
  const [jobs, setJobs] = useState(initialJobs)

  useEffect(() => {
    setJobs(initialJobs)
  }, [initialJobs])

  function handleSavedChange(jobId: string, saved: boolean) {
    if (!saved) {
      setJobs((current) => current.filter((job) => job.id !== jobId))
    }
  }

  function handleAppliedChange() {
    router.refresh()
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No saved jobs yet</CardTitle>
          <CardDescription>
            Save jobs from the Jobs page to keep them here for later.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Saved jobs</h2>
          <p className="text-xs text-muted-foreground">
            Jobs you bookmarked, with the latest application progress
          </p>
        </div>
        <span className="hidden text-xs text-muted-foreground sm:inline">
          {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
        </span>
      </div>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            applicationStatus={job.applicationStatus}
            onSavedChange={handleSavedChange}
            onAppliedChange={handleAppliedChange}
          />
        ))}
      </div>
    </div>
  )
}
