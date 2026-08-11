import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import {
  mapFieldsToProfile,
  profileHasResume,
  splitFullName,
} from "@/lib/automation/map-fields"
import { getLatestParsedResume } from "@/lib/applications/resume"
import { getFullProfileWithClient } from "@/lib/profile/queries"
import type { DetectedField, FullProfile, MissingField } from "@/lib/types/database"

export async function patchProfileFromMissingFields(
  supabase: SupabaseClient,
  userId: string,
  fullProfile: FullProfile,
  missingFields: MissingField[],
  values: Record<string, string>
) {
  const profileUpdates: Record<string, string | null> = {}
  let { firstName, lastName } = splitFullName(fullProfile.profile.full_name)

  for (const field of missingFields) {
    if (field.profileKey === "resume") continue

    const value = values[field.fieldId]?.trim()
    if (!value) continue

    switch (field.profileKey) {
      case "firstName":
        firstName = value
        break
      case "lastName":
        lastName = value
        break
      case "fullName":
        profileUpdates.full_name = value
        break
      case "email":
        profileUpdates.email = value
        break
      case "phone":
        profileUpdates.phone = value
        break
      case "location":
        profileUpdates.location = value
        break
      case "linkedinUrl":
        profileUpdates.linkedin_url = value
        break
      case "githubUrl":
        profileUpdates.github_url = value
        break
      case "websiteUrl":
        profileUpdates.website_url = value
        break
      case "professionalSummary":
        profileUpdates.professional_summary = value
        break
      case "workExperience":
        if (fullProfile.workExperiences.length === 0) {
          const atMatch = value.match(/^(.+?)\s+at\s+(.+)$/i)
          const { error } = await supabase.from("work_experiences").insert({
            user_id: userId,
            company: atMatch?.[2]?.trim() ?? value,
            title: atMatch?.[1]?.trim() ?? "Professional",
            start_date: null,
            end_date: null,
            is_current: true,
            responsibilities: [],
            sort_order: 0,
          })
          if (error) throw error
        }
        break
      case "education":
        if (fullProfile.education.length === 0) {
          const { error } = await supabase.from("education").insert({
            user_id: userId,
            institution: value,
            degree: null,
            field_of_study: null,
            start_date: null,
            end_date: null,
            description: null,
            sort_order: 0,
          })
          if (error) throw error
        }
        break
      default:
        break
    }
  }

  if (firstName || lastName) {
    profileUpdates.full_name = [firstName, lastName].filter(Boolean).join(" ")
  }

  if (Object.keys(profileUpdates).length > 0) {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...profileUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (error) throw error
  }
}

export async function recheckApplicationMapping(
  supabase: SupabaseClient,
  userId: string,
  detectedFields: DetectedField[],
  applicationFieldValues: Record<string, string>
) {
  const profile = await getFullProfileWithClient(supabase, userId)
  if (!profile) {
    throw new Error("User profile not found")
  }

  const resume = await getLatestParsedResume(supabase, userId)
  const hasResume = profileHasResume(profile, resume ? [resume] : [])

  return mapFieldsToProfile(
    detectedFields,
    profile,
    hasResume,
    applicationFieldValues
  )
}
