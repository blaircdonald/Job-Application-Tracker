import { redirect } from "next/navigation"

import { DEFAULT_DASHBOARD_PATH } from "@/components/dashboard/nav-config"

export default function DashboardPage() {
  redirect(DEFAULT_DASHBOARD_PATH)
}
