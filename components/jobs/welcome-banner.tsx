"use client"

import { Sparkles } from "lucide-react"

type WelcomeBannerProps = {
  name: string
  role: string
  jobCount: number
  fromCache: boolean
}

export function WelcomeBanner({
  name,
  role,
  jobCount,
  fromCache,
}: WelcomeBannerProps) {
  const greeting = name ? `Welcome back, ${name.split(" ")[0]}` : "Welcome back"

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
      <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            AI-matched opportunities
          </div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {greeting}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            {jobCount > 0
              ? `We found ${jobCount} roles matching your profile as a ${role}.`
              : `Searching for ${role} roles tailored to your skills and location.`}
            {fromCache && jobCount > 0 && (
              <span className="ml-1 text-xs">Showing cached results from the last 6 hours.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
