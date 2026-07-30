import type { ProfileFormData, ProfileSectionId } from "@/lib/types/database"

export type { ProfileSectionId }

export type SectionCompleteness = {
  id: ProfileSectionId
  label: string
  complete: boolean
}

function hasText(value: string) {
  return value.trim().length > 0
}

function isWorkExperienceComplete(
  items: ProfileFormData["workExperiences"]
) {
  return items.some(
    (item) => hasText(item.company) && hasText(item.title)
  )
}

function isEducationComplete(items: ProfileFormData["education"]) {
  return items.some((item) => hasText(item.institution))
}

function isProjectComplete(items: ProfileFormData["projects"]) {
  return items.some((item) => hasText(item.name))
}

function isCertificationComplete(items: ProfileFormData["certifications"]) {
  return items.some((item) => hasText(item.name))
}

function isLinksComplete(data: ProfileFormData) {
  return (
    hasText(data.linkedinUrl) ||
    hasText(data.githubUrl) ||
    hasText(data.websiteUrl) ||
    data.links.some((link) => hasText(link.label) && hasText(link.url))
  )
}

export function getSectionCompleteness(
  data: ProfileFormData
): SectionCompleteness[] {
  return [
    {
      id: "personal",
      label: "Personal info",
      complete:
        hasText(data.fullName) &&
        hasText(data.email) &&
        (hasText(data.phone) || hasText(data.location)),
    },
    {
      id: "summary",
      label: "Summary",
      complete: hasText(data.professionalSummary),
    },
    {
      id: "skills",
      label: "Skills",
      complete: data.skills.length > 0,
    },
    {
      id: "experience",
      label: "Work experience",
      complete: isWorkExperienceComplete(data.workExperiences),
    },
    {
      id: "education",
      label: "Education",
      complete: isEducationComplete(data.education),
    },
    {
      id: "projects",
      label: "Projects",
      complete: isProjectComplete(data.projects),
    },
    {
      id: "certifications",
      label: "Certifications",
      complete: isCertificationComplete(data.certifications),
    },
    {
      id: "links",
      label: "Links",
      complete: isLinksComplete(data),
    },
  ]
}

export function calculateProfileCompleteness(data: ProfileFormData): number {
  const sections = getSectionCompleteness(data)
  const completed = sections.filter((section) => section.complete).length
  return Math.round((completed / sections.length) * 100)
}

export type ProgressTone = "low" | "medium" | "high" | "complete"

export function getProgressTone(percentage: number): ProgressTone {
  if (percentage >= 100) return "complete"
  if (percentage >= 67) return "high"
  if (percentage >= 34) return "medium"
  return "low"
}

export function getProgressColors(percentage: number) {
  const tone = getProgressTone(percentage)

  switch (tone) {
    case "complete":
      return {
        stroke: "stroke-emerald-500",
        text: "text-emerald-600 dark:text-emerald-400",
        badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        ring: "ring-emerald-500/20",
      }
    case "high":
      return {
        stroke: "stroke-primary",
        text: "text-primary",
        badge: "bg-primary/10 text-primary",
        ring: "ring-primary/20",
      }
    case "medium":
      return {
        stroke: "stroke-amber-500",
        text: "text-amber-600 dark:text-amber-400",
        badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        ring: "ring-amber-500/20",
      }
    case "low":
      return {
        stroke: "stroke-destructive",
        text: "text-destructive",
        badge: "bg-destructive/10 text-destructive",
        ring: "ring-destructive/20",
      }
  }
}

export function getProgressMessage(percentage: number): string {
  if (percentage >= 100) return "Your profile is complete!"
  if (percentage >= 67) return "Almost there — a few sections left."
  if (percentage >= 34) return "Good start — keep filling in details."
  return "Get started by completing your profile sections."
}
