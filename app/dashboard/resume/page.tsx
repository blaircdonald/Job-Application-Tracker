import { ResumeList } from "@/components/resume/resume-list"
import { ResumeUpload } from "@/components/resume/resume-upload"
import { getUserResumes } from "@/lib/profile/queries"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "Resume",
}

export default async function ResumePage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub

  if (!userId) {
    return null
  }

  const resumes = await getUserResumes(userId)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Resume</h1>
        <p className="text-sm text-muted-foreground">
          Manage your uploaded resumes and re-parse them to refresh your profile.
        </p>
      </div>
      <ResumeUpload />
      <ResumeList resumes={resumes} />
    </div>
  )
}
