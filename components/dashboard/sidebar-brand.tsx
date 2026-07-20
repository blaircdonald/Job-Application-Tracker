"use client"

import Link from "next/link"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function SidebarBrand() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          render={<Link href="/dashboard" />}
          tooltip="JobBuddy AI"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
            JB
          </span>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-semibold">JobBuddy AI</span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              Job application assistant
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
