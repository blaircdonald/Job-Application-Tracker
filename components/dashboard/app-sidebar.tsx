"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { DailyAppliesDisplay } from "@/components/dashboard/daily-applies-display"
import { SidebarBrand } from "@/components/dashboard/sidebar-brand"
import {
  dashboardRoot,
  mainNavItems,
} from "@/components/dashboard/nav-config"
import type { DailyApplyUsage } from "@/lib/applications/daily-limit"

type AppSidebarProps = {
  dailyApplies: DailyApplyUsage
}

function isNavActive(pathname: string, href: string) {
  if (href === dashboardRoot.href) {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar({ dailyApplies }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarBrand />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isNavActive(pathname, item.href)}
                    tooltip={item.title}
                  >
                    <HugeiconsIcon icon={item.icon} strokeWidth={2} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <DailyAppliesDisplay usage={dailyApplies} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
