export type ParseStatus = "pending" | "processing" | "parsed" | "failed"

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  location: string | null
  professional_summary: string | null
  linkedin_url: string | null
  github_url: string | null
  website_url: string | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export type Resume = {
  id: string
  user_id: string
  storage_path: string
  original_filename: string
  mime_type: string
  file_size: number
  parse_status: ParseStatus
  parse_error: string | null
  parsed_at: string | null
  created_at: string
  updated_at: string
}

export type WorkExperience = {
  id: string
  user_id: string
  company: string
  title: string
  start_date: string | null
  end_date: string | null
  is_current: boolean
  responsibilities: string[]
  sort_order: number
}

export type Education = {
  id: string
  user_id: string
  institution: string
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
  description: string | null
  sort_order: number
}

export type Skill = {
  id: string
  user_id: string
  name: string
  sort_order: number
}

export type Project = {
  id: string
  user_id: string
  name: string
  description: string | null
  url: string | null
  technologies: string[]
  sort_order: number
}

export type Certification = {
  id: string
  user_id: string
  name: string
  issuer: string | null
  issue_date: string | null
  expiry_date: string | null
  credential_url: string | null
  sort_order: number
}

export type ProfileLink = {
  id: string
  user_id: string
  label: string
  url: string
  sort_order: number
}

export type FullProfile = {
  profile: Profile
  skills: Skill[]
  workExperiences: WorkExperience[]
  education: Education[]
  projects: Project[]
  certifications: Certification[]
  links: ProfileLink[]
}

export type ProfileFormData = {
  fullName: string
  email: string
  phone: string
  location: string
  professionalSummary: string
  linkedinUrl: string
  githubUrl: string
  websiteUrl: string
  skills: string[]
  workExperiences: Array<{
    company: string
    title: string
    startDate: string
    endDate: string
    isCurrent: boolean
    responsibilities: string[]
  }>
  education: Array<{
    institution: string
    degree: string
    fieldOfStudy: string
    startDate: string
    endDate: string
    description: string
  }>
  projects: Array<{
    name: string
    description: string
    url: string
    technologies: string[]
  }>
  certifications: Array<{
    name: string
    issuer: string
    issueDate: string
    expiryDate: string
    credentialUrl: string
  }>
  links: Array<{
    label: string
    url: string
  }>
}
