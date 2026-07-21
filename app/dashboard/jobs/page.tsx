import { JobsDashboard } from "@/components/jobs/jobs-dashboard"
import { JobsPageSkeleton } from "@/components/jobs/job-list-skeleton"
import { fullProfileToFormData } from "@/lib/profile/save-parsed-data"
import { getFullProfile } from "@/lib/profile/queries"
import { DEFAULT_PLATFORMS } from "@/lib/jobs/platforms"
import {
  fetchAndCacheJobs,
  getRecentActivity,
} from "@/lib/jobs/queries"
import { buildJobSearchContext } from "@/lib/jobs/search-context"
import type { ProfileFormData } from "@/lib/types/database"
import { createClient } from "@/lib/supabase/server"
import { Suspense } from "react"

export const metadata = {
  title: "Jobs",
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

async function JobsContent() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return null
  }

  const fullProfile = await getFullProfile(userId)
  const profileData = fullProfile
    ? fullProfileToFormData(fullProfile)
    : emptyFormData
  const searchContext = buildJobSearchContext(profileData)

  let initialJobs: Awaited<ReturnType<typeof fetchAndCacheJobs>>["jobs"] = []
  let fromCache = false
  let fetchedAt: string | null = null

  try {
    const result = await fetchAndCacheJobs(
      userId,
      profileData,
      DEFAULT_PLATFORMS,
      false
    )
    initialJobs = result.jobs
    fromCache = result.fromCache
    fetchedAt = result.fetchedAt
  } catch {
    // Client will retry on mount if initial fetch fails
  }

  const recentActivity = await getRecentActivity(userId)

  return (
    <JobsDashboard
      initialJobs={initialJobs}
      initialFromCache={fromCache}
      initialFetchedAt={fetchedAt}
      profileData={profileData}
      searchContext={searchContext}
      recentActivity={recentActivity}
      userName={profileData.fullName}
    />
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={<JobsPageSkeleton />}>
      <JobsContent />
    </Suspense>
  )
}
