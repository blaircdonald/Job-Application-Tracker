"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ResumeUploadForm } from "@/components/onboarding/resume-upload-form"

type OnboardingGateProps = {
  needsOnboarding: boolean
  children: React.ReactNode
}

export function OnboardingGate({
  needsOnboarding,
  children,
}: OnboardingGateProps) {
  return (
    <>
      {children}
      <Dialog
        open={needsOnboarding}
        onOpenChange={(open) => {
          if (!open && needsOnboarding) return
        }}
        modal
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload your resume to get started</DialogTitle>
            <DialogDescription>
              Before you can use ApplyAI, upload your resume so we can build
              your profile automatically.
            </DialogDescription>
          </DialogHeader>
          <ResumeUploadForm />
        </DialogContent>
      </Dialog>
    </>
  )
}
