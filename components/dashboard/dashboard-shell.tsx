"use client"

import { AppSidebar } from "@/components/dashboard/app-sidebar"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import type { DailyApplyUsage } from "@/lib/applications/daily-limit"

type DashboardShellProps = {
  defaultOpen: boolean
  dailyApplies: DailyApplyUsage
  children: React.ReactNode
}

export function DashboardShell({
  defaultOpen,
  dailyApplies,
  children,
}: DashboardShellProps) {
  return (
    <TooltipProvider delay={0}>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar dailyApplies={dailyApplies} />
        <SidebarInset>
          <DashboardHeader />
          <div className="flex flex-1 flex-col bg-muted/20">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
