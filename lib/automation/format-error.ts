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

export function formatAutomationError(error: unknown): string {
  const message = getErrorMessage(error)

  if (isGeminiQuotaErrorMessage(message)) {
    return "Gemini API quota exceeded. Check usage at ai.dev/rate-limit, enable billing on your Google AI project, or set STAGEHAND_MODEL in .env.local to a model with available quota."
  }

  if (/Missing GEMINI_API_KEY/i.test(message)) {
    return "Gemini API key is not configured. Add GEMINI_API_KEY to .env.local."
  }

  if (/Missing BROWSERBASE/i.test(message)) {
    return "Browserbase is not configured. Add BROWSERBASE_API_KEY and BROWSERBASE_PROJECT_ID to .env.local."
  }

  const cleaned = message.replace(
    /^AI_RetryError:\s*Failed after \d+ attempts\.\s*Last error:\s*/i,
    ""
  )

  return cleaned.slice(0, 500)
}
