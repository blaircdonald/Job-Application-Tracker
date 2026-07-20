import { ProfileForm } from "@/components/profile/profile-form"
import { fullProfileToFormData } from "@/lib/profile/save-parsed-data"
import { getFullProfile } from "@/lib/profile/queries"
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

export default async function ProfilePage() {
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

  return <ProfileForm initialData={initialData} />
}
