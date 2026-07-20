import { revalidatePath } from "next/cache"
import { randomUUID } from "crypto"

import { saveParsedResumeData } from "@/lib/profile/save-parsed-data"
import { parseResume } from "@/lib/resume/parse-resume"
import {
  ACCEPTED_RESUME_TYPES,
  MAX_RESUME_SIZE,
} from "@/lib/resume/constants"
import { createClient } from "@/lib/supabase/server"

export type UploadResumeResult =
  | { success: true; resumeId: string }
  | { success: false; error: string }

function validateResumeFile(file: File): string | null {
  if (!ACCEPTED_RESUME_TYPES.includes(file.type as (typeof ACCEPTED_RESUME_TYPES)[number])) {
    return "Please upload a PDF or DOCX file."
  }

  if (file.size > MAX_RESUME_SIZE) {
    return "File size must be 5 MB or less."
  }

  return null
}

export async function processResumeUpload(
  file: File,
  userId: string
): Promise<UploadResumeResult> {
  const validationError = validateResumeFile(file)
  if (validationError) {
    return { success: false, error: validationError }
  }

  const supabase = await createClient()
  const resumeId = randomUUID()
  const storagePath = `${userId}/${resumeId}/${file.name}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: insertError } = await supabase.from("resumes").insert({
    id: resumeId,
    user_id: userId,
    storage_path: storagePath,
    original_filename: file.name,
    mime_type: file.type,
    file_size: file.size,
    parse_status: "processing",
  })

  if (insertError) {
    return { success: false, error: "Failed to create resume record." }
  }

  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    await supabase
      .from("resumes")
      .update({
        parse_status: "failed",
        parse_error: uploadError.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resumeId)

    return { success: false, error: "Failed to upload resume file." }
  }

  try {
    const parsed = await parseResume(buffer, file.type)
    await saveParsedResumeData(supabase, userId, parsed, true)

    await supabase
      .from("resumes")
      .update({
        parse_status: "parsed",
        parsed_at: new Date().toISOString(),
        parse_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resumeId)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to parse resume."

    await supabase
      .from("resumes")
      .update({
        parse_status: "failed",
        parse_error: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", resumeId)

    return { success: false, error: message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/profile")
  revalidatePath("/dashboard/resume")

  return { success: true, resumeId }
}
