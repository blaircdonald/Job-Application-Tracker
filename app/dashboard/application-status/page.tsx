import { ApplicationStatusList } from "@/components/applications/application-status-list"
import { getUserApplications } from "@/lib/applications/queries"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Application Status",
}

export default async function ApplicationStatusPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return null
  }

  const applications = await getUserApplications(supabase, userId)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Application Status
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track auto-apply progress, missing profile fields, and Browserbase
          debug sessions.
        </p>
      </div>
      <ApplicationStatusList applications={applications} />
    </div>
  )
}
