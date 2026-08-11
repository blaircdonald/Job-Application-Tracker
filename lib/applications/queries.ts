import type { SupabaseClient } from "@supabase/supabase-js"

import type {
  ApplicationStatus,
  DetectedField,
  Job,
  JobApplication,
  JobApplicationWithJob,
  MissingField,
} from "@/lib/types/database"

type JobApplicationRow = {
  id: string
  user_id: string
  job_id: string
  status: ApplicationStatus
  detected_platform: string | null
  detected_fields: DetectedField[] | null
  missing_fields: MissingField[] | null
  application_field_values: Record<string, string> | null
  browserbase_session_id: string | null
  error_message: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
  jobs?: Job | Job[] | null
}

function mapApplication(row: JobApplicationRow): JobApplication {
  return {
    id: row.id,
    user_id: row.user_id,
    job_id: row.job_id,
    status: row.status,
    detected_platform: row.detected_platform,
    detected_fields: row.detected_fields ?? [],
    missing_fields: row.missing_fields ?? [],
    application_field_values: row.application_field_values ?? {},
    browserbase_session_id: row.browserbase_session_id,
    error_message: row.error_message,
    submitted_at: row.submitted_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function resolveJob(row: JobApplicationRow): Job | null {
  if (!row.jobs) return null
  return Array.isArray(row.jobs) ? (row.jobs[0] ?? null) : row.jobs
}

export async function getApplicationForJob(
  supabase: SupabaseClient,
  userId: string,
  jobId: string
): Promise<JobApplication | null> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapApplication(data as JobApplicationRow)
}

export async function getApplicationById(
  supabase: SupabaseClient,
  applicationId: string
): Promise<JobApplication | null> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return mapApplication(data as JobApplicationRow)
}

export async function getApplicationWithJob(
  supabase: SupabaseClient,
  applicationId: string
): Promise<JobApplicationWithJob | null> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*, jobs(*)")
    .eq("id", applicationId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const job = resolveJob(data as JobApplicationRow)
  if (!job) return null

  return {
    ...mapApplication(data as JobApplicationRow),
    job,
  }
}

export async function createJobApplication(
  supabase: SupabaseClient,
  userId: string,
  jobId: string
): Promise<JobApplication> {
  const { data, error } = await supabase
    .from("job_applications")
    .insert({
      user_id: userId,
      job_id: jobId,
      status: "queued",
    })
    .select("*")
    .single()

  if (error) throw error

  return mapApplication(data as JobApplicationRow)
}

export async function updateApplicationStatus(
  supabase: SupabaseClient,
  applicationId: string,
  updates: Partial<
    Pick<
      JobApplication,
      | "status"
      | "detected_platform"
      | "detected_fields"
      | "missing_fields"
      | "application_field_values"
      | "browserbase_session_id"
      | "error_message"
      | "submitted_at"
    >
  >
): Promise<void> {
  const { error } = await supabase
    .from("job_applications")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)

  if (error) throw error
}

export async function markJobAsApplied(
  supabase: SupabaseClient,
  userId: string,
  jobId: string
): Promise<void> {
  const { error } = await supabase
    .from("jobs")
    .update({ applied_status: true })
    .eq("id", jobId)
    .eq("user_id", userId)

  if (error) throw error
}

export async function getUserApplications(
  supabase: SupabaseClient,
  userId: string
): Promise<JobApplicationWithJob[]> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*, jobs(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return (data ?? [])
    .map((row) => {
      const job = resolveJob(row as JobApplicationRow)
      if (!job) return null
      return {
        ...mapApplication(row as JobApplicationRow),
        job,
      }
    })
    .filter((item): item is JobApplicationWithJob => item !== null)
}

export async function getPendingMissingProfileApplications(
  supabase: SupabaseClient,
  userId: string
): Promise<JobApplicationWithJob[]> {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*, jobs(*)")
    .eq("user_id", userId)
    .eq("status", "missing_profile_info")
    .order("updated_at", { ascending: false })

  if (error) throw error

  return (data ?? [])
    .map((row) => {
      const job = resolveJob(row as JobApplicationRow)
      if (!job) return null
      return {
        ...mapApplication(row as JobApplicationRow),
        job,
      }
    })
    .filter((item): item is JobApplicationWithJob => item !== null)
}