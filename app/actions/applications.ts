"use server"

import { revalidatePath } from "next/cache"

import {
  createJobApplication,
  getApplicationForJob,
  getApplicationWithJob,
  isActiveApplicationStatus,
  updateApplicationStatus,
} from "@/lib/applications/queries"
import {
  buildApplicationFieldValues,
  getFillableMissingFields,
} from "@/lib/applications/missing-fields-utils"
import {
  patchProfileFromMissingFields,
  recheckApplicationMapping,
} from "@/lib/applications/save-missing-fields"
import { resolveApplicationPlatform } from "@/lib/automation/detect-platform"
import { isAutoApplySupported } from "@/lib/automation/detect-platform"
import { sendApplicationEvent } from "@/lib/inngest/send-event"
import { getFullProfileWithClient } from "@/lib/profile/queries"
import { createClient } from "@/lib/supabase/server"
import type { ApplicationStatus, JobApplication, JobPlatform } from "@/lib/types/database"

export type StartAutoApplyResult =
  | { success: true; application: JobApplication; status: ApplicationStatus }
  | { success: false; error: string }

export async function startAutoApply(jobId: string): Promise<StartAutoApplyResult> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single()

  if (jobError || !job) {
    return { success: false, error: "Job not found." }
  }

  const platform = resolveApplicationPlatform(
    job.job_url,
    job.platform as JobPlatform
  )

  if (!platform || !isAutoApplySupported(platform)) {
    return {
      success: false,
      error: "Auto-apply is not available for this platform.",
    }
  }

  const existing = await getApplicationForJob(supabase, userId, jobId)
  if (existing?.status === "submitted") {
    return {
      success: false,
      error: "You have already applied to this job.",
    }
  }
  if (existing && isActiveApplicationStatus(existing.status)) {
    return {
      success: false,
      error: "An application is already in progress for this job.",
    }
  }

  try {
    const application =
      existing ??
      (await createJobApplication(supabase, userId, jobId))

    await sendApplicationEvent({
      name: "app/application.detect-fields",
      data: {
        applicationId: application.id,
        userId,
        jobId,
        jobUrl: job.job_url,
        platform,
      },
    })

    revalidatePath("/dashboard/jobs")
    revalidatePath("/dashboard/application-status")

    return {
      success: true,
      application,
      status: application.status,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start auto-apply."
    return { success: false, error: message }
  }
}

export type GetApplicationForJobResult =
  | { success: true; application: JobApplication | null }
  | { success: false; error: string }

export async function getApplicationForJobAction(
  jobId: string
): Promise<GetApplicationForJobResult> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return { success: false, error: "You must be signed in." }
  }

  try {
    const application = await getApplicationForJob(supabase, userId, jobId)
    return { success: true, application }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load application."
    return { success: false, error: message }
  }
}

export type RetryApplicationResult =
  | { success: true }
  | { success: false; error: string }

export async function retryApplication(
  applicationId: string
): Promise<RetryApplicationResult> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: application, error } = await supabase
    .from("job_applications")
    .select("*, jobs(*)")
    .eq("id", applicationId)
    .eq("user_id", userId)
    .single()

  if (error || !application) {
    return { success: false, error: "Application not found." }
  }

  const job = Array.isArray(application.jobs)
    ? application.jobs[0]
    : application.jobs

  if (!job) {
    return { success: false, error: "Job not found for application." }
  }

  const platform = resolveApplicationPlatform(
    job.job_url,
    job.platform as JobPlatform
  )

  if (!platform) {
    return { success: false, error: "Unsupported platform for auto-apply." }
  }

  try {
    if (application.status === "failed") {
      await updateApplicationStatus(supabase, applicationId, {
        status: "queued",
        error_message: null,
      })

      await sendApplicationEvent({
        name: "app/application.detect-fields",
        data: {
          applicationId,
          userId,
          jobId: job.id,
          jobUrl: job.job_url,
          platform,
        },
      })
    } else if (
      application.status === "missing_profile_info" ||
      application.status === "ready_to_submit"
    ) {
      await sendApplicationEvent({
        name: "app/application.submit",
        data: {
          applicationId,
          userId,
          jobId: job.id,
          jobUrl: job.job_url,
          platform,
        },
      })
    } else {
      return { success: false, error: "Application cannot be retried right now." }
    }

    revalidatePath("/dashboard/profile")
    revalidatePath("/dashboard/application-status")

    return { success: true }
  } catch (retryError) {
    const message =
      retryError instanceof Error
        ? retryError.message
        : "Failed to retry application."
    return { success: false, error: message }
  }
}

export type SaveMissingApplicationFieldsResult =
  | { success: true; status: ApplicationStatus; stillMissing: boolean }
  | { success: false; error: string }

export async function saveMissingApplicationFields(
  applicationId: string,
  values: Record<string, string>
): Promise<SaveMissingApplicationFieldsResult> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return { success: false, error: "You must be signed in." }
  }

  const application = await getApplicationWithJob(supabase, applicationId)
  if (!application || application.user_id !== userId) {
    return { success: false, error: "Application not found." }
  }

  if (application.status !== "missing_profile_info") {
    return {
      success: false,
      error: "Application is not waiting for missing profile info.",
    }
  }

  const fillableFields = getFillableMissingFields(application.missing_fields)
  const unfilled = fillableFields.filter((field) => !values[field.fieldId]?.trim())
  if (unfilled.length > 0) {
    return { success: false, error: "Please fill in all required fields." }
  }

  try {
    const fullProfile = await getFullProfileWithClient(supabase, userId)
    if (!fullProfile) {
      return { success: false, error: "Profile not found." }
    }

    await patchProfileFromMissingFields(
      supabase,
      userId,
      fullProfile,
      application.missing_fields,
      values
    )

    const applicationFieldValues = buildApplicationFieldValues(
      application.application_field_values,
      application.missing_fields,
      values
    )

    const mapping = await recheckApplicationMapping(
      supabase,
      userId,
      application.detected_fields,
      applicationFieldValues
    )

    const nextStatus =
      mapping.missing.length === 0 ? "ready_to_submit" : "missing_profile_info"

    await updateApplicationStatus(supabase, applicationId, {
      status: nextStatus,
      missing_fields: mapping.missing,
      application_field_values: applicationFieldValues,
    })

    if (nextStatus === "ready_to_submit") {
      const platform = resolveApplicationPlatform(
        application.job.job_url,
        application.job.platform
      )

      if (platform) {
        await sendApplicationEvent({
          name: "app/application.submit",
          data: {
            applicationId,
            userId,
            jobId: application.job_id,
            jobUrl: application.job.job_url,
            platform,
          },
        })
      }
    }

    revalidatePath("/dashboard/application-status")
    revalidatePath("/dashboard/profile")
    revalidatePath("/dashboard/jobs")

    return {
      success: true,
      status: nextStatus,
      stillMissing: mapping.missing.length > 0,
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save missing fields."
    return { success: false, error: message }
  }
}
