"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ResumeUploadForm } from "@/components/onboarding/resume-upload-form"

export function ResumeUpload() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload resume</CardTitle>
        <CardDescription>
          Upload a PDF or DOCX resume. We&apos;ll parse it and update your
          profile automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResumeUploadForm compact />
      </CardContent>
    </Card>
  )
}
