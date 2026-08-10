import type { SupabaseClient } from "@supabase/supabase-js"

export const DAILY_APPLY_LIMIT = 50
export const DAILY_APPLY_TIMEZONE = "America/New_York"

export const DAILY_APPLY_LIMIT_MESSAGE =
  "You've used all 50 auto-applies for today. Your limit resets at 12:00 AM. You can still apply manually."

export type DailyApplyUsage = {
  used: number
  remaining: number
  limit: number
  date: string
}

/** Calendar date YYYY-MM-DD in the daily-limit timezone. */
export function getDailyApplyDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_APPLY_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

function toUsage(used: number, date: string): DailyApplyUsage {
  const clamped = Math.max(0, Math.min(used, DAILY_APPLY_LIMIT))
  return {
    used: clamped,
    remaining: Math.max(0, DAILY_APPLY_LIMIT - clamped),
    limit: DAILY_APPLY_LIMIT,
    date,
  }
}

export async function getDailyApplyUsage(
  supabase: SupabaseClient,
  userId: string
): Promise<DailyApplyUsage> {
  const today = getDailyApplyDate()
  const { data, error } = await supabase
    .from("profiles")
    .select("daily_applies_used, daily_applies_date")
    .eq("id", userId)
    .single()

  if (error) throw error

  const used =
    data?.daily_applies_date === today ? (data.daily_applies_used ?? 0) : 0

  return toUsage(used, today)
}

export type ConsumeDailyApplyResult =
  | { success: true; usage: DailyApplyUsage }
  | { success: false; error: string; usage: DailyApplyUsage }

/**
 * Atomically consume one daily apply if under the limit.
 * Resets used count to 0 when the calendar day rolls over.
 */
export async function tryConsumeDailyApply(
  supabase: SupabaseClient,
  userId: string
): Promise<ConsumeDailyApplyResult> {
  const today = getDailyApplyDate()

  const { data: profile, error: readError } = await supabase
    .from("profiles")
    .select("daily_applies_used, daily_applies_date")
    .eq("id", userId)
    .single()

  if (readError) throw readError

  const currentUsed =
    profile?.daily_applies_date === today ? (profile.daily_applies_used ?? 0) : 0

  if (currentUsed >= DAILY_APPLY_LIMIT) {
    return {
      success: false,
      error: DAILY_APPLY_LIMIT_MESSAGE,
      usage: toUsage(currentUsed, today),
    }
  }

  const nextUsed = currentUsed + 1

  // Conditional update prevents racing past the limit under concurrent applies.
  let query = supabase
    .from("profiles")
    .update({
      daily_applies_used: nextUsed,
      daily_applies_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (profile?.daily_applies_date === today) {
    query = query.eq("daily_applies_used", currentUsed)
  } else {
    query = query.or(
      `daily_applies_date.is.null,daily_applies_date.neq.${today}`
    )
  }

  const { data: updated, error: updateError } = await query
    .select("daily_applies_used, daily_applies_date")
    .maybeSingle()

  if (updateError) throw updateError

  if (!updated) {
    const usage = await getDailyApplyUsage(supabase, userId)
    return {
      success: false,
      error: DAILY_APPLY_LIMIT_MESSAGE,
      usage,
    }
  }

  return {
    success: true,
    usage: toUsage(updated.daily_applies_used ?? nextUsed, today),
  }
}
