"use server"

import { revalidatePath } from "next/cache"

import { saveProfileFormData } from "@/lib/profile/save-parsed-data"
import type { ProfileFormData } from "@/lib/types/database"
import { createClient } from "@/lib/supabase/server"

export type UpdateProfileResult =
  | { success: true }
  | { success: false; error: string }

export async function updateProfile(
  data: ProfileFormData
): Promise<UpdateProfileResult> {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) {
    return { success: false, error: "You must be signed in." }
  }

  try {
    await saveProfileFormData(supabase, userId, data)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save profile."
    return { success: false, error: message }
  }

  revalidatePath("/dashboard/profile")

  return { success: true }
}
