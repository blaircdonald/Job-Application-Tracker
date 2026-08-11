"use server"

import { revalidatePath } from "next/cache"

import { markJobAsApplied } from "@/lib/applications/queries"
import {
  fetchAndCacheJobs,
  updateJobSavedStatus,
} from "@/lib/jobs/queries"
import { fullProfileToFormData } from "@/lib/profile/save-parsed-data"
import { getFullProfile } from "@/lib/profile/queries"
import type { EmploymentType, JobPlatform } from "@/lib/types/database"
import { createClient } from "@/lib/supabase/server"
import { DEFAULT_EMPLOYMENT_TYPE } from "@/lib/jobs/search-context"

export type FetchJobsResult =
  | {
      success: true
      jobs: Awaited<ReturnType<typeof fetchAndCacheJobs>>["jobs"]
      fromCache: boolean
      fetchedAt: string | null
    }
  | { success: false; error: string }

export async function fetchJobs(
  platforms: JobPlatform[],
  forceRefresh = false,
  employmentType: EmploymentType = DEFAULT_EMPLOYMENT_TYPE
): Promise<FetchJobsResult> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return { success: false, error: "You must be signed in." }
  }

  const fullProfile = await getFullProfile(userId)
  if (!fullProfile) {
    return { success: false, error: "Complete your profile to search for jobs." }
  }

  const profileData = fullProfileToFormData(fullProfile)

  try {
    const result = await fetchAndCacheJobs(
      userId,
      profileData,
      platforms,
      forceRefresh,
      employmentType
    )

    revalidatePath("/dashboard/jobs")
    revalidatePath("/dashboard/saved-jobs")

    return {
      success: true,
      jobs: result.jobs,
      fromCache: result.fromCache,
      fetchedAt: result.fetchedAt,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch jobs."
    return { success: false, error: message }
  }
}

export type MarkJobAppliedResult =
  | { success: true }
  | { success: false; error: string }

export async function markJobApplied(
  jobId: string
): Promise<MarkJobAppliedResult> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return { success: false, error: "You must be signed in." }
  }

  try {
    await markJobAsApplied(supabase, userId, jobId)
    revalidatePath("/dashboard/jobs")
    revalidatePath("/dashboard/saved-jobs")
    return { success: true }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mark job as applied."
    return { success: false, error: message }
  }
}

export type ToggleSaveJobResult =
  | { success: true; saved: boolean }
  | { success: false; error: string }

export async function toggleSaveJob(
  jobId: string,
  saved: boolean
): Promise<ToggleSaveJobResult> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return { success: false, error: "You must be signed in." }
  }

  try {
    await updateJobSavedStatus(userId, jobId, saved)
    revalidatePath("/dashboard/jobs")
    revalidatePath("/dashboard/saved-jobs")
    return { success: true, saved }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update saved status."
    return { success: false, error: message }
  }
}
