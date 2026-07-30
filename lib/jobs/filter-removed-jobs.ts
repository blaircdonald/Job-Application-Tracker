import type { BraveWebResult } from "./brave-search"

const REMOVED_JOB_PATTERNS = [
  /\bpage not found\b/i,
  /\b404\b/,
  /\bjob (?:has been |is )?(?:removed|deleted|closed|expired|unavailable)\b/i,
  /\bposition (?:has been |is )?(?:filled|closed|removed|no longer available)\b/i,
  /\bno longer (?:accepting|available|open)\b/i,
  /\bthis (?:job|position|posting) (?:is )?(?:closed|expired|no longer)\b/i,
  /\blisting (?:has )?expired\b/i,
  /\bjob not found\b/i,
  /\bsorry,? this job\b/i,
  /\bwe couldn['']t find this job\b/i,
  /\bapplication (?:is )?closed\b/i,
  /\bno longer hiring\b/i,
]

export function isLikelyRemovedJob(result: Pick<BraveWebResult, "title" | "description" | "url">): boolean {
  const text = `${result.title} ${result.description}`.trim()
  if (!text) return false

  return REMOVED_JOB_PATTERNS.some((pattern) => pattern.test(text))
}

export function filterActiveJobResults<T extends Pick<BraveWebResult, "title" | "description" | "url">>(
  results: T[]
): T[] {
  return results.filter((result) => !isLikelyRemovedJob(result))
}
