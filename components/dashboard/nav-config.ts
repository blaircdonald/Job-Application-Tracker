import {
  Briefcase01Icon,
  CheckListIcon,
  CreditCardIcon,
  File01Icon,
  Settings01Icon,
  User03Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

export type NavItem = {
  title: string
  href: string
  icon: IconSvgElement
}

export const mainNavItems: NavItem[] = [
  {
    title: "Jobs",
    href: "/dashboard/jobs",
    icon: Briefcase01Icon,
  },
  {
    title: "Resume",
    href: "/dashboard/resume",
    icon: File01Icon,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User03Icon,
  },
  {
    title: "Application Status",
    href: "/dashboard/application-status",
    icon: CheckListIcon,
  },
]

export const footerNavItems: NavItem[] = [
  {
    title: "Billing / Credits",
    href: "/dashboard/billing",
    icon: CreditCardIcon,
  },
  {
    title: "Profile Settings",
    href: "/dashboard/settings",
    icon: Settings01Icon,
  },
]

export const dashboardRoot = {
  title: "Dashboard",
  href: "/dashboard",
}

export function getPageTitle(pathname: string): string {
  if (pathname === dashboardRoot.href) {
    return dashboardRoot.title
  }

  const item = [...mainNavItems, ...footerNavItems].find(
    (navItem) => navItem.href === pathname
  )

  return item?.title ?? dashboardRoot.title
}
