import { createClient } from "@/lib/supabase/server"
import type {
  ApplicationStatus,
  Job,
  JobPlatform,
  JobWithApplicationStatus,
  ProfileFormData,
} from "@/lib/types/database"

import { searchBraveJobs } from "./brave-search"
import { normalizeBraveResults } from "./normalize"
import { DEFAULT_PLATFORMS } from "./platforms"
import {
  buildJobSearchContext,
  type JobSearchContext,
} from "./search-context"

const CACHE_TTL_MS = 6 * 60 * 60 * 1000

export type JobsFetchResult = {
  jobs: Job[]
  fromCache: boolean
  fetchedAt: string | null
  context: JobSearchContext
}

function isCacheFresh(fetchedAt: string | null | undefined): boolean {
  if (!fetchedAt) return false
  const age = Date.now() - new Date(fetchedAt).getTime()
  return age < CACHE_TTL_MS
}

function getPlatformsWithJobs(
  cachedJobs: Job[],
  platforms: JobPlatform[]
): Set<JobPlatform> {
  return new Set(
    platforms.filter((platform) =>
      cachedJobs.some((job) => job.platform === platform)
    )
  )
}

function getStalePlatforms(
  platforms: JobPlatform[],
  cachedJobs: Job[]
): JobPlatform[] {
  return platforms.filter(
    (platform) => !cachedJobs.some((job) => job.platform === platform)
  )
}

export async function getLatestFetchTime(
  userId: string
): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("jobs")
    .select("fetched_at")
    .eq("user_id", userId)
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.fetched_at ?? null
}

export async function getCachedJobs(
  userId: string,
  platforms?: JobPlatform[]
): Promise<Job[]> {
  const supabase = await createClient()
  let query = supabase
    .from("jobs")
    .select("*")
    .eq("user_id", userId)
    .eq("applied_status", false)
    .order("match_score", { ascending: false })

  if (platforms && platforms.length > 0) {
    query = query.in("platform", platforms)
  }

  const { data, error } = await query

  if (error) throw error

  return (data ?? []).map(mapJobRow)
}

export async function getSavedJobs(
  userId: string
): Promise<JobWithApplicationStatus[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", userId)
    .eq("saved_status", true)
    .order("created_at", { ascending: false })

  if (error) throw error

  const jobs = (data ?? []).map(mapJobRow)
  if (jobs.length === 0) return []

  const jobIds = jobs.map((job) => job.id)
  const { data: applications, error: applicationsError } = await supabase
    .from("job_applications")
    .select("job_id, status")
    .eq("user_id", userId)
    .in("job_id", jobIds)

  if (applicationsError) throw applicationsError

  const statusByJobId = new Map<string, ApplicationStatus>()
  for (const application of applications ?? []) {
    statusByJobId.set(
      application.job_id as string,
      application.status as ApplicationStatus
    )
  }

  return jobs.map((job) => {
    const applicationStatus = statusByJobId.get(job.id)
    if (applicationStatus) {
      return { ...job, applicationStatus }
    }
    if (job.applied_status) {
      return { ...job, applicationStatus: "applied" as const }
    }
    return { ...job, applicationStatus: null }
  })
}

function mapJobRow(row: Record<string, unknown>): Job {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    platform: row.platform as JobPlatform,
    title: row.title as string,
    company: (row.company as string | null) ?? null,
    company_logo: (row.company_logo as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    salary: (row.salary as string | null) ?? null,
    job_type: (row.job_type as string | null) ?? null,
    experience_level: (row.experience_level as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    match_score: row.match_score as number,
    job_url: row.job_url as string,
    source_url: (row.source_url as string | null) ?? null,
    applied_status: row.applied_status as boolean,
    saved_status: row.saved_status as boolean,
    posted_at: (row.posted_at as string | null) ?? null,
    fetched_at: row.fetched_at as string,
    created_at: row.created_at as string,
  }
}

async function purgeStaleJobs(
  userId: string,
  platforms: JobPlatform[],
  activeJobUrls: Set<string>
) {
  if (platforms.length === 0) return

  const supabase = await createClient()
  const { data: existingJobs, error: fetchError } = await supabase
    .from("jobs")
    .select("id, job_url, saved_status, applied_status")
    .eq("user_id", userId)
    .in("platform", platforms)

  if (fetchError) throw fetchError

  const staleJobIds = (existingJobs ?? [])
    .filter(
      (job) =>
        !activeJobUrls.has(job.job_url) &&
        !job.saved_status &&
        !job.applied_status
    )
    .map((job) => job.id)

  if (staleJobIds.length === 0) return

  const { error: deleteError } = await supabase
    .from("jobs")
    .delete()
    .eq("user_id", userId)
    .in("id", staleJobIds)

  if (deleteError) throw deleteError
}

async function upsertJobs(
  userId: string,
  jobs: Array<{
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
    fetched_at: string
  }>
) {
  if (jobs.length === 0) return

  const supabase = await createClient()
  const rows = jobs.map((job) => ({
    user_id: userId,
    ...job,
    tags: job.tags,
  }))

  const { error } = await supabase.from("jobs").upsert(rows, {
    onConflict: "user_id,job_url",
    ignoreDuplicates: false,
  })

  if (error) throw error
}

async function fetchPlatformsFromBrave(
  userId: string,
  platforms: JobPlatform[],
  context: JobSearchContext,
  fetchedAt: string
) {
  const normalizedJobs = []
  const errors: Error[] = []

  for (const platform of platforms) {
    try {
      const results = await searchBraveJobs(platform, context)
      normalizedJobs.push(
        ...normalizeBraveResults(results, platform, context).map((job) => ({
          ...job,
          fetched_at: fetchedAt,
        }))
      )
    } catch (error) {
      console.error(`Failed to fetch jobs for ${platform}:`, error)
      errors.push(
        error instanceof Error ? error : new Error(`Failed to fetch ${platform}`)
      )
    }
  }

  if (normalizedJobs.length > 0) {
    await upsertJobs(userId, normalizedJobs)
  }

  return { normalizedJobs, errors }
}

export async function fetchAndCacheJobs(
  userId: string,
  profileData: ProfileFormData,
  platforms: JobPlatform[] = DEFAULT_PLATFORMS,
  forceRefresh = false
): Promise<JobsFetchResult> {
  const context = buildJobSearchContext(profileData)
  const latestFetch = await getLatestFetchTime(userId)
  const cacheFresh = isCacheFresh(latestFetch)
  const cachedJobs = await getCachedJobs(userId)

  const platformsToFetch = forceRefresh
    ? platforms
    : cacheFresh
      ? getStalePlatforms(platforms, cachedJobs)
      : platforms

  if (platformsToFetch.length === 0) {
    return {
      jobs: cachedJobs,
      fromCache: true,
      fetchedAt: latestFetch,
      context,
    }
  }

  const fetchedAt = new Date().toISOString()
  const { normalizedJobs, errors } = await fetchPlatformsFromBrave(
    userId,
    platformsToFetch,
    context,
    fetchedAt
  )

  if (forceRefresh && normalizedJobs.length > 0) {
    const activeJobUrls = new Set(normalizedJobs.map((job) => job.job_url))
    await purgeStaleJobs(userId, platformsToFetch, activeJobUrls)
  }

  const jobs = await getCachedJobs(userId)

  if (jobs.length === 0 && errors.length > 0) {
    throw errors[0]
  }

  const usedCache =
    cacheFresh &&
    !forceRefresh &&
    getPlatformsWithJobs(cachedJobs, platforms).size > 0

  return {
    jobs,
    fromCache: usedCache && normalizedJobs.length === 0,
    fetchedAt:
      normalizedJobs.length > 0
        ? fetchedAt
        : latestFetch ?? fetchedAt,
    context,
  }
}

export async function updateJobSavedStatus(
  userId: string,
  jobId: string,
  saved: boolean
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("jobs")
    .update({ saved_status: saved })
    .eq("id", jobId)
    .eq("user_id", userId)

  if (error) throw error
}

export type RecentActivityItem = {
  id: string
  type: "saved" | "fetched" | "applied"
  label: string
  timestamp: string
}

export async function getRecentActivity(
  userId: string
): Promise<RecentActivityItem[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("jobs")
    .select("id, title, company, saved_status, applied_status, fetched_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (!data) return []

  const activities: RecentActivityItem[] = []

  for (const job of data) {
    if (job.saved_status) {
      activities.push({
        id: `${job.id}-saved`,
        type: "saved",
        label: `Saved ${job.title}${job.company ? ` at ${job.company}` : ""}`,
        timestamp: job.created_at,
      })
    }
    if (job.applied_status) {
      activities.push({
        id: `${job.id}-applied`,
        type: "applied",
        label: `Applied to ${job.title}${job.company ? ` at ${job.company}` : ""}`,
        timestamp: job.created_at,
      })
    }
  }

  const latestFetch = await getLatestFetchTime(userId)
  if (latestFetch) {
    activities.push({
      id: "fetch-latest",
      type: "fetched",
      label: "Job matches refreshed",
      timestamp: latestFetch,
    })
  }

  return activities
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 6)
}
