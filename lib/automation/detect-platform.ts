import type { JobPlatform } from "@/lib/types/database"
import { isPlatformJobUrl } from "@/lib/jobs/platforms"

export const AUTO_APPLY_PLATFORMS: JobPlatform[] = [
  "greenhouse",
  "lever",
  "workable",
  "wellfound",
]

export function isAutoApplySupported(platform: JobPlatform): boolean {
  return AUTO_APPLY_PLATFORMS.includes(platform)
}

export function detectPlatformFromUrl(url: string): JobPlatform | null {
  for (const platform of AUTO_APPLY_PLATFORMS) {
    if (isPlatformJobUrl(url, platform)) {
      return platform
    }
  }

  return null
}

export function resolveApplicationPlatform(
  jobUrl: string,
  fallbackPlatform: JobPlatform
): JobPlatform | null {
  const detected = detectPlatformFromUrl(jobUrl)
  if (detected) return detected

  if (isAutoApplySupported(fallbackPlatform)) {
    return fallbackPlatform
  }

  return null
}
