import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: {
    template: "%s | JobBuddy AI",
    default: "Dashboard | JobBuddy AI",
  },
  description: "Your JobBuddy AI dashboard",
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims?.sub) {
    redirect("/sign-in?redirectTo=/dashboard")
  }

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return <DashboardShell defaultOpen={defaultOpen}>{children}</DashboardShell>
}
