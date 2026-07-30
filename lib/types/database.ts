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

export type JobPlatform =
  | "greenhouse"
  | "lever"
  | "workable"
  | "wellfound"
  | "linkedin"
  | "indeed"

export type Job = {
  id: string
  user_id: string
  platform: JobPlatform
  title: string
  company: string | null
  company_logo: string | null
  location: string | null
  salary: string | null
  job_type: string | null
  experience_level: string | null
  description: string | null
  tags: string[]
  match_score: number
  job_url: string
  source_url: string | null
  applied_status: boolean
  saved_status: boolean
  posted_at: string | null
  fetched_at: string
  created_at: string
}

export type ApplicationStatus =
  | "queued"
  | "detecting_fields"
  | "missing_profile_info"
  | "ready_to_submit"
  | "submitting"
  | "submitted"
  | "failed"

export type DetectedField = {
  id: string
  label: string
  type: "text" | "email" | "tel" | "file" | "select" | "textarea" | "checkbox" | "unknown"
  required: boolean
  selector?: string
}

export type MissingField = {
  fieldId: string
  label: string
  profileKey: string
  profileSection: ProfileSectionId
}

export type ProfileSectionId =
  | "personal"
  | "summary"
  | "skills"
  | "experience"
  | "education"
  | "projects"
  | "certifications"
  | "links"
  | "resume"

export type JobApplication = {
  id: string
  user_id: string
  job_id: string
  status: ApplicationStatus
  detected_platform: string | null
  detected_fields: DetectedField[]
  missing_fields: MissingField[]
  browserbase_session_id: string | null
  error_message: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export type JobApplicationWithJob = JobApplication & {
  job: Job
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
