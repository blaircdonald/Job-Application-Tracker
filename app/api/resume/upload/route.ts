import { NextResponse } from "next/server"

import { processResumeUpload } from "@/lib/resume/upload-and-parse"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: claimsData } = await supabase.auth.getClaims()
  const userId = claimsData?.claims?.sub

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "You must be signed in to upload a resume." },
      { status: 401 }
    )
  }

  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "No file provided." },
      { status: 400 }
    )
  }

  const result = await processResumeUpload(file, userId)

  if (!result.success) {
    return NextResponse.json(result, { status: 422 })
  }

  return NextResponse.json(result)
}
