export const DEFAULT_STAGEHAND_MODEL = "google/gemini-2.5-flash"

export function getStagehandModel(): string {
  return (
    process.env.STAGEHAND_MODEL?.trim() ||
    process.env.STAGEHAND_MODDEL?.trim() ||
    DEFAULT_STAGEHAND_MODEL
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function isGeminiQuotaError(error: unknown): boolean {
  return isGeminiQuotaErrorMessage(getErrorMessage(error))
}

export function isGeminiQuotaErrorMessage(message: string): boolean {
  return (
    /quota exceeded/i.test(message) ||
    /exceeded your current quota/i.test(message) ||
    /free_tier/i.test(message)
  )
}

/**
 * Maps automation failures to short, user-facing messages.
 * Raw provider/config details stay in server logs only.
 */
export function formatAutomationError(error: unknown): string {
  const message = getErrorMessage(error)
  console.error("[auto-apply]", message)

  if (isGeminiQuotaErrorMessage(message)) {
    return "Auto-apply is temporarily unavailable. Please try again later."
  }

  if (/Missing GEMINI_API_KEY|Gemini API key/i.test(message)) {
    return "Auto-apply is temporarily unavailable. Please try again later."
  }

  if (/Missing BROWSERBASE|Browserbase/i.test(message)) {
    return "Auto-apply is temporarily unavailable. Please try again later."
  }

  if (/timeout|timed out|navigation timeout/i.test(message)) {
    return "The application page took too long to respond. Please try again."
  }

  if (/net::|ECONNREFUSED|ENOTFOUND|fetch failed|network/i.test(message)) {
    return "We couldn’t reach the job application page. Please try again."
  }

  if (/captcha|cloudflare|access denied|blocked/i.test(message)) {
    return "This application page blocked automated filling. Try applying manually."
  }

  if (/not found|404|page.*(removed|closed|expired)/i.test(message)) {
    return "This job posting may no longer be available."
  }

  if (/resume|file upload|download resume/i.test(message)) {
    return "We couldn’t attach your resume. Check that a resume is uploaded, then retry."
  }

  if (/profile not found/i.test(message)) {
    return "Your profile couldn’t be loaded. Please refresh and try again."
  }

  return "Something went wrong while applying. Please try again."
}
