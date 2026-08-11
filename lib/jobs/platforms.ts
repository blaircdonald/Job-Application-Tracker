import type { JobPlatform } from "@/lib/types/database"

export type JobPlatformConfig = {
  id: JobPlatform
  name: string
  searchSites: string[]
  siteClause?: string
  logoSrc: string
  description: string
  accentClass: string
  selectedClass: string
}

export const JOB_PLATFORMS: JobPlatformConfig[] = [
  {
    id: "greenhouse",
    name: "Greenhouse",
    searchSites: ["job-boards.greenhouse.io", "boards.greenhouse.io"],
    logoSrc: "/platforms/greenhouse.jpeg",
    description: "ATS listings from Greenhouse-powered companies",
    accentClass: "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10",
    selectedClass: "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20",
  },
  {
    id: "lever",
    name: "Lever",
    searchSites: ["jobs.lever.co", "lever.co"],
    logoSrc: "/platforms/lever.png",
    description: "Roles posted through Lever recruiting",
    accentClass: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10",
    selectedClass: "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20",
  },
  {
    id: "workable",
    name: "Workable",
    searchSites: ["apply.workable.com", "jobs.workable.com"],
    logoSrc: "/platforms/workable.png",
    description: "Global openings on Workable boards",
    accentClass: "border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10",
    selectedClass: "border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/20",
  },
  {
    id: "wellfound",
    name: "Wellfound",
    searchSites: ["wellfound.com", "angel.co"],
    logoSrc: "/platforms/wellfound.png",
    description: "Startup roles from Wellfound (AngelList)",
    accentClass: "border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10",
    selectedClass: "border-rose-500 bg-rose-500/10 ring-2 ring-rose-500/20",
  },
  {
    id: "indeed",
    name: "Indeed",
    searchSites: ["indeed.com", "www.indeed.com"],
    siteClause:
      "site:indeed.com/viewjob OR site:www.indeed.com/viewjob OR site:indeed.com/rc/clk",
    logoSrc: "/platforms/indeed.jpg",
    description: "Global job search from Indeed",
    accentClass: "border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10",
    selectedClass: "border-indigo-600 bg-indigo-500/10 ring-2 ring-indigo-500/20",
  },
]

export const DEFAULT_PLATFORMS: JobPlatform[] = JOB_PLATFORMS.map(
  (platform) => platform.id
)

export function getPlatformConfig(id: JobPlatform) {
  return JOB_PLATFORMS.find((platform) => platform.id === id)
}

export function isPlatformJobUrl(url: string, platform: JobPlatform): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace(/^www\./, "")
    const pathname = parsed.pathname.toLowerCase()

    if (platform === "indeed") {
      return (
        hostname.includes("indeed.com") &&
        (pathname.includes("/viewjob") ||
          pathname.includes("/rc/clk") ||
          parsed.searchParams.has("jk"))
      )
    }

    const config = getPlatformConfig(platform)
    if (!config) return false

    return config.searchSites.some(
      (site) => hostname === site || hostname.endsWith(`.${site}`)
    )
  } catch {
    return false
  }
}

export function buildPlatformSiteClause(platform: JobPlatform): string {
  const config = getPlatformConfig(platform)
  if (!config) {
    throw new Error(`Unknown platform: ${platform}`)
  }

  if (config.siteClause) {
    return config.siteClause
  }

  return config.searchSites.map((site) => `site:${site}`).join(" OR ")
}
