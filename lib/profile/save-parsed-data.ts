import type { SupabaseClient } from "@supabase/supabase-js"

import type { ParsedResume } from "@/lib/resume/schema"
import type { ProfileFormData } from "@/lib/types/database"

export async function saveParsedResumeData(
  supabase: SupabaseClient,
  userId: string,
  parsed: ParsedResume,
  completeOnboarding = true
) {
  const profile = parsed.profile ?? {}

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: profile.fullName ?? undefined,
      email: profile.email ?? undefined,
      phone: profile.phone ?? undefined,
      location: profile.location ?? undefined,
      professional_summary: profile.professionalSummary ?? undefined,
      linkedin_url: profile.linkedinUrl ?? undefined,
      github_url: profile.githubUrl ?? undefined,
      website_url: profile.websiteUrl ?? undefined,
      onboarding_completed: completeOnboarding,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (profileError) throw profileError

  await replaceChildRows(supabase, userId, parsedToFormData(parsed))
}

export async function saveProfileFormData(
  supabase: SupabaseClient,
  userId: string,
  data: ProfileFormData
) {
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: data.fullName || null,
      email: data.email || null,
      phone: data.phone || null,
      location: data.location || null,
      professional_summary: data.professionalSummary || null,
      linkedin_url: data.linkedinUrl || null,
      github_url: data.githubUrl || null,
      website_url: data.websiteUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (profileError) throw profileError

  await replaceChildRows(supabase, userId, data)
}

async function replaceChildRows(
  supabase: SupabaseClient,
  userId: string,
  data: ProfileFormData
) {
  const tables = [
    "skills",
    "work_experiences",
    "education",
    "projects",
    "certifications",
    "profile_links",
  ] as const

  for (const table of tables) {
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)

    if (deleteError) throw deleteError
  }

  if (data.skills.length > 0) {
    const { error } = await supabase.from("skills").insert(
      data.skills.map((name, index) => ({
        user_id: userId,
        name,
        sort_order: index,
      }))
    )
    if (error) throw error
  }

  if (data.workExperiences.length > 0) {
    const { error } = await supabase.from("work_experiences").insert(
      data.workExperiences.map((item, index) => ({
        user_id: userId,
        company: item.company,
        title: item.title,
        start_date: item.startDate || null,
        end_date: item.endDate || null,
        is_current: item.isCurrent,
        responsibilities: item.responsibilities,
        sort_order: index,
      }))
    )
    if (error) throw error
  }

  if (data.education.length > 0) {
    const { error } = await supabase.from("education").insert(
      data.education.map((item, index) => ({
        user_id: userId,
        institution: item.institution,
        degree: item.degree || null,
        field_of_study: item.fieldOfStudy || null,
        start_date: item.startDate || null,
        end_date: item.endDate || null,
        description: item.description || null,
        sort_order: index,
      }))
    )
    if (error) throw error
  }

  if (data.projects.length > 0) {
    const { error } = await supabase.from("projects").insert(
      data.projects.map((item, index) => ({
        user_id: userId,
        name: item.name,
        description: item.description || null,
        url: item.url || null,
        technologies: item.technologies,
        sort_order: index,
      }))
    )
    if (error) throw error
  }

  if (data.certifications.length > 0) {
    const { error } = await supabase.from("certifications").insert(
      data.certifications.map((item, index) => ({
        user_id: userId,
        name: item.name,
        issuer: item.issuer || null,
        issue_date: item.issueDate || null,
        expiry_date: item.expiryDate || null,
        credential_url: item.credentialUrl || null,
        sort_order: index,
      }))
    )
    if (error) throw error
  }

  if (data.links.length > 0) {
    const { error } = await supabase.from("profile_links").insert(
      data.links.map((item, index) => ({
        user_id: userId,
        label: item.label,
        url: item.url,
        sort_order: index,
      }))
    )
    if (error) throw error
  }
}

export function parsedToFormData(parsed: ParsedResume): ProfileFormData {
  const profile = parsed.profile ?? {}

  return {
    fullName: profile.fullName ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    professionalSummary: profile.professionalSummary ?? "",
    linkedinUrl: profile.linkedinUrl ?? "",
    githubUrl: profile.githubUrl ?? "",
    websiteUrl: profile.websiteUrl ?? "",
    skills: parsed.skills ?? [],
    workExperiences: (parsed.workExperiences ?? []).map((item) => ({
      company: item.company,
      title: item.title,
      startDate: item.startDate ?? "",
      endDate: item.endDate ?? "",
      isCurrent: item.isCurrent ?? false,
      responsibilities: item.responsibilities ?? [],
    })),
    education: (parsed.education ?? []).map((item) => ({
      institution: item.institution,
      degree: item.degree ?? "",
      fieldOfStudy: item.fieldOfStudy ?? "",
      startDate: item.startDate ?? "",
      endDate: item.endDate ?? "",
      description: item.description ?? "",
    })),
    projects: (parsed.projects ?? []).map((item) => ({
      name: item.name,
      description: item.description ?? "",
      url: item.url ?? "",
      technologies: item.technologies ?? [],
    })),
    certifications: (parsed.certifications ?? []).map((item) => ({
      name: item.name,
      issuer: item.issuer ?? "",
      issueDate: item.issueDate ?? "",
      expiryDate: item.expiryDate ?? "",
      credentialUrl: item.credentialUrl ?? "",
    })),
    links: (parsed.links ?? []).map((item) => ({
      label: item.label,
      url: item.url,
    })),
  }
}

export function fullProfileToFormData(
  fullProfile: import("@/lib/types/database").FullProfile
): ProfileFormData {
  const { profile } = fullProfile

  return {
    fullName: profile.full_name ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    location: profile.location ?? "",
    professionalSummary: profile.professional_summary ?? "",
    linkedinUrl: profile.linkedin_url ?? "",
    githubUrl: profile.github_url ?? "",
    websiteUrl: profile.website_url ?? "",
    skills: fullProfile.skills.map((s) => s.name),
    workExperiences: fullProfile.workExperiences.map((item) => ({
      company: item.company,
      title: item.title,
      startDate: item.start_date ?? "",
      endDate: item.end_date ?? "",
      isCurrent: item.is_current,
      responsibilities: item.responsibilities,
    })),
    education: fullProfile.education.map((item) => ({
      institution: item.institution,
      degree: item.degree ?? "",
      fieldOfStudy: item.field_of_study ?? "",
      startDate: item.start_date ?? "",
      endDate: item.end_date ?? "",
      description: item.description ?? "",
    })),
    projects: fullProfile.projects.map((item) => ({
      name: item.name,
      description: item.description ?? "",
      url: item.url ?? "",
      technologies: item.technologies,
    })),
    certifications: fullProfile.certifications.map((item) => ({
      name: item.name,
      issuer: item.issuer ?? "",
      issueDate: item.issue_date ?? "",
      expiryDate: item.expiry_date ?? "",
      credentialUrl: item.credential_url ?? "",
    })),
    links: fullProfile.links.map((item) => ({
      label: item.label,
      url: item.url,
    })),
  }
}
