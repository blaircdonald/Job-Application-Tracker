"use client"

import { usePathname } from "next/navigation"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { getPageTitle } from "@/components/dashboard/nav-config"

export function DashboardHeader() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <h1 className="text-sm font-medium">{pageTitle}</h1>
      <div className="ml-auto">
        <SignOutButton />
      </div>
    </header>
  )
}
