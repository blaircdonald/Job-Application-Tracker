"use client"

import { useCallback, useEffect, useState, useTransition } from "react"

import { fetchJobs } from "@/app/actions/jobs"
import { JobsEmptyState } from "@/components/jobs/jobs-empty-state"
import { JobsErrorState } from "@/components/jobs/jobs-error-state"
import { JobsSearchEmptyState } from "@/components/jobs/jobs-search-empty-state"
import { JobList } from "@/components/jobs/job-list"
import { JobListSkeleton } from "@/components/jobs/job-list-skeleton"
import { JobSearchBar } from "@/components/jobs/job-search-bar"
import { PlatformCards } from "@/components/jobs/platform-cards"
import { RecentActivityCard } from "@/components/jobs/recent-activity-card"
import { WelcomeBanner } from "@/components/jobs/welcome-banner"
import { ProfileCompletenessCard } from "@/components/profile/profile-completeness-card"
import { filterJobs } from "@/lib/jobs/filter-jobs"
import { DEFAULT_PLATFORMS } from "@/lib/jobs/platforms"
import type { JobSearchContext } from "@/lib/jobs/search-context"
import type { RecentActivityItem } from "@/lib/jobs/queries"
import type { Job, JobPlatform, ProfileFormData } from "@/lib/types/database"

type JobsDashboardProps = {
  initialJobs: Job[]
  initialFromCache: boolean
  initialFetchedAt: string | null
  profileData: ProfileFormData
  searchContext: JobSearchContext
  recentActivity: RecentActivityItem[]
  userName: string
}

export function JobsDashboard({
  initialJobs,
  initialFromCache,
  initialFetchedAt,
  profileData,
  searchContext,
  recentActivity,
  userName,
}: JobsDashboardProps) {
  const [jobs, setJobs] = useState(initialJobs)
  const [selectedPlatforms, setSelectedPlatforms] =
    useState<JobPlatform[]>(DEFAULT_PLATFORMS)
  const [fromCache, setFromCache] = useState(initialFromCache)
  const [fetchedAt, setFetchedAt] = useState(initialFetchedAt)
  const [error, setError] = useState<string | null>(null)
  const [activities, setActivities] = useState(recentActivity)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPending, startTransition] = useTransition()

  const loadJobs = useCallback(
    (platforms: JobPlatform[], forceRefresh = false) => {
      setError(null)

      startTransition(async () => {
        const result = await fetchJobs(platforms, forceRefresh)

        if (result.success) {
          setJobs(result.jobs)
          setFromCache(result.fromCache)
          setFetchedAt(result.fetchedAt)
        } else {
          setError(result.error)
        }
      })
    },
    []
  )

  useEffect(() => {
    const missingPlatforms = selectedPlatforms.filter(
      (platform) => !initialJobs.some((job) => job.platform === platform)
    )

    if (missingPlatforms.length > 0 || initialJobs.length === 0) {
      loadJobs(selectedPlatforms, false)
    }
    // Only run on mount to backfill missing platforms
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handlePlatformChange(platforms: JobPlatform[]) {
    setSelectedPlatforms(platforms)

    const missingPlatforms = platforms.filter(
      (platform) => !jobs.some((job) => job.platform === platform)
    )

    if (missingPlatforms.length > 0) {
      loadJobs(platforms, false)
    }
  }

  function handleRefresh() {
    loadJobs(selectedPlatforms, true)
  }

  function handleSavedChange(jobId: string, saved: boolean) {
    setJobs((current) =>
      current.map((job) =>
        job.id === jobId ? { ...job, saved_status: saved } : job
      )
    )

    const target = jobs.find((job) => job.id === jobId)
    if (!target) return

    if (saved) {
      setActivities((current) => [
        {
          id: `${jobId}-saved-${Date.now()}`,
          type: "saved" as const,
          label: `Saved ${target.title}${target.company ? ` at ${target.company}` : ""}`,
          timestamp: new Date().toISOString(),
        },
        ...current,
      ].slice(0, 6))
    }
  }

  function handleAppliedChange(jobId: string) {
    const target = jobs.find((job) => job.id === jobId)
    setJobs((current) => current.filter((job) => job.id !== jobId))

    if (target) {
      setActivities((current) =>
        [
          {
            id: `${jobId}-applied-${Date.now()}`,
            type: "applied" as const,
            label: `Applied to ${target.title}${target.company ? ` at ${target.company}` : ""}`,
            timestamp: new Date().toISOString(),
          },
          ...current,
        ].slice(0, 6)
      )
    }
  }

  const platformJobs = jobs.filter((job) =>
    selectedPlatforms.includes(job.platform)
  )
  const filteredJobs = filterJobs(platformJobs, searchQuery)
  const hasSearchQuery = searchQuery.trim().length > 0

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <WelcomeBanner
        name={userName}
        role={searchContext.role}
        jobCount={filteredJobs.length}
        fromCache={fromCache}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <PlatformCards
              selected={selectedPlatforms}
              onChange={handlePlatformChange}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <JobSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            resultCount={hasSearchQuery ? filteredJobs.length : undefined}
          />

          {error && !isPending && (
            <JobsErrorState
              message={error}
              onRetry={handleRefresh}
              isRetrying={isPending}
            />
          )}

          {isPending && jobs.length === 0 ? (
            <JobListSkeleton />
          ) : !error && filteredJobs.length > 0 ? (
            <JobList
              jobs={filteredJobs}
              onSavedChange={handleSavedChange}
              onAppliedChange={handleAppliedChange}
              onRefresh={handleRefresh}
              isRefreshing={isPending}
            />
          ) : !error && !isPending && hasSearchQuery && platformJobs.length > 0 ? (
            <JobsSearchEmptyState
              query={searchQuery.trim()}
              onClear={() => setSearchQuery("")}
            />
          ) : !error && !isPending ? (
            <JobsEmptyState onRefresh={handleRefresh} isRefreshing={isPending} />
          ) : null}

          {isPending && jobs.length > 0 && (
            <p className="text-xs text-muted-foreground">Updating matches…</p>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <ProfileCompletenessCard data={profileData} />
          <RecentActivityCard activities={activities} />
          {fetchedAt && (
            <p className="text-center text-[0.65rem] text-muted-foreground lg:text-left">
              Last fetched{" "}
              {new Date(fetchedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
