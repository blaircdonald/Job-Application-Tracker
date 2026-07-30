import { ProfileForm } from "@/components/profile/profile-form"
import { fullProfileToFormData } from "@/lib/profile/save-parsed-data"
import { getFullProfile } from "@/lib/profile/queries"
import {
  getApplicationWithJob,
  getPendingMissingProfileApplications,
} from "@/lib/applications/queries"
import { createClient } from "@/lib/supabase/server"
import type { ProfileFormData } from "@/lib/types/database"

export const metadata = {
  title: "Profile",
}

const emptyFormData: ProfileFormData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  professionalSummary: "",
  linkedinUrl: "",
  githubUrl: "",
  websiteUrl: "",
  skills: [],
  workExperiences: [],
  education: [],
  projects: [],
  certifications: [],
  links: [],
}

type ProfilePageProps = {
  searchParams: Promise<{ applicationId?: string }>
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const { applicationId } = await searchParams
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return null
  }

  const fullProfile = await getFullProfile(userId)
  const initialData = fullProfile
    ? fullProfileToFormData(fullProfile)
    : emptyFormData

  const pendingApplications = await getPendingMissingProfileApplications(
    supabase,
    userId
  )

  const selectedApplication = applicationId
    ? ((await getApplicationWithJob(supabase, applicationId)) ??
      pendingApplications[0] ??
      null)
    : (pendingApplications[0] ?? null)

  const highlightProfileKeys =
    selectedApplication?.missing_fields.map((field) => field.profileKey) ?? []

  return (
    <ProfileForm
      initialData={initialData}
      pendingApplication={selectedApplication}
      highlightProfileKeys={highlightProfileKeys}
    />
  )
}
