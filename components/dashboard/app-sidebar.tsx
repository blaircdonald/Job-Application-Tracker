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
import { CreditsDisplay } from "@/components/dashboard/credits-display"
import { SidebarBrand } from "@/components/dashboard/sidebar-brand"
import {
  dashboardRoot,
  footerNavItems,
  mainNavItems,
} from "@/components/dashboard/nav-config"

const billingNavItem = footerNavItems[0]
const settingsNavItem = footerNavItems[1]

function isNavActive(pathname: string, href: string) {
  if (href === dashboardRoot.href) {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar() {
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
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href={billingNavItem.href} />}
                  isActive={isNavActive(pathname, billingNavItem.href)}
                  tooltip={billingNavItem.title}
                >
                  <HugeiconsIcon icon={billingNavItem.icon} strokeWidth={2} />
                  <span>{billingNavItem.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <CreditsDisplay />

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href={settingsNavItem.href} />}
              isActive={isNavActive(pathname, settingsNavItem.href)}
              tooltip={settingsNavItem.title}
            >
              <HugeiconsIcon icon={settingsNavItem.icon} strokeWidth={2} />
              <span>{settingsNavItem.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
