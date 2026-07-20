"use server"

import { processResumeUpload } from "@/lib/resume/upload-and-parse"
import { createClient } from "@/lib/supabase/server"

export type { UploadResumeResult } from "@/lib/resume/upload-and-parse"

export async function uploadAndParseResume(formData: FormData) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) {
    return { success: false as const, error: "You must be signed in to upload a resume." }
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return { success: false as const, error: "No file provided." }
  }

  return processResumeUpload(file, userId)
}

export async function getResumeDownloadUrl(
  resumeId: string
): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) {
    return { error: "You must be signed in." }
  }

  const { data: resume, error } = await supabase
    .from("resumes")
    .select("storage_path")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .single()

  if (error || !resume) {
    return { error: "Resume not found." }
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("resumes")
    .createSignedUrl(resume.storage_path, 60)

  if (signError || !signed?.signedUrl) {
    return { error: "Failed to generate download link." }
  }

  return { url: signed.signedUrl }
}

export async function deleteResume(
  resumeId: string
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) {
    return { success: false, error: "You must be signed in." }
  }

  const { data: resume, error } = await supabase
    .from("resumes")
    .select("storage_path")
    .eq("id", resumeId)
    .eq("user_id", userId)
    .single()

  if (error || !resume) {
    return { success: false, error: "Resume not found." }
  }

  await supabase.storage.from("resumes").remove([resume.storage_path])

  const { error: deleteError } = await supabase
    .from("resumes")
    .delete()
    .eq("id", resumeId)

  if (deleteError) {
    return { success: false, error: "Failed to delete resume." }
  }

  const { revalidatePath } = await import("next/cache")
  revalidatePath("/dashboard/resume")

  return { success: true }
}
