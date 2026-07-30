import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Resume } from "@/lib/types/database"

export async function getLatestParsedResume(
  supabase: SupabaseClient,
  userId: string
): Promise<Resume | null> {
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .eq("parse_status", "parsed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return (data as Resume | null) ?? null
}

export async function downloadResumeToTempFile(
  supabase: SupabaseClient,
  resume: Resume
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("resumes")
    .download(resume.storage_path)

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to download resume file")
  }

  const buffer = Buffer.from(await data.arrayBuffer())
  const tempDir = await mkdtemp(join(tmpdir(), "job-application-resume-"))
  const filePath = join(tempDir, resume.original_filename)

  await writeFile(filePath, buffer)

  return filePath
}
