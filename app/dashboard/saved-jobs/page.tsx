import { SavedJobsList } from "@/components/jobs/saved-jobs-list"
import { getSavedJobs } from "@/lib/jobs/queries"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Saved Jobs",
}

export default async function SavedJobsPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return null
  }

  const jobs = await getSavedJobs(userId)

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Saved Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review bookmarked roles and track application progress in one place.
        </p>
      </div>
      <SavedJobsList initialJobs={jobs} />
    </div>
  )
}
