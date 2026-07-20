import { createClient } from "@/lib/supabase/server"
import type { FullProfile, Profile, Resume } from "@/lib/types/database"

export async function getProfileOnboardingStatus(
  userId: string
): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .single()

  return data?.onboarding_completed ?? false
}

export async function getFullProfile(userId: string): Promise<FullProfile | null> {
  const supabase = await createClient()

  const [
    profileResult,
    skillsResult,
    workResult,
    educationResult,
    projectsResult,
    certificationsResult,
    linksResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("skills")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order"),
    supabase
      .from("work_experiences")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order"),
    supabase
      .from("education")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order"),
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order"),
    supabase
      .from("certifications")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order"),
    supabase
      .from("profile_links")
      .select("*")
      .eq("user_id", userId)
      .order("sort_order"),
  ])

  if (profileResult.error || !profileResult.data) {
    return null
  }

  return {
    profile: profileResult.data as Profile,
    skills: skillsResult.data ?? [],
    workExperiences: workResult.data ?? [],
    education: educationResult.data ?? [],
    projects: projectsResult.data ?? [],
    certifications: certificationsResult.data ?? [],
    links: linksResult.data ?? [],
  }
}

export async function getUserResumes(userId: string): Promise<Resume[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  return (data ?? []) as Resume[]
}
