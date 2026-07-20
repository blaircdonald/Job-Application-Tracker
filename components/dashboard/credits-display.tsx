"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Coins01Icon } from "@hugeicons/core-free-icons"
import {
  Progress,
  ProgressIndicator,
  ProgressTrack,
} from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const DEFAULT_CREDITS = 25
const DEFAULT_CREDIT_LIMIT = 100

type CreditsDisplayProps = {
  credits?: number
  creditLimit?: number
}

export function CreditsDisplay({
  credits = DEFAULT_CREDITS,
  creditLimit = DEFAULT_CREDIT_LIMIT,
}: CreditsDisplayProps) {
  const { state, isMobile } = useSidebar()
  const isCollapsed = state === "collapsed" && !isMobile
  const progressValue = Math.min(100, Math.round((credits / creditLimit) * 100))

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              className={cn(
                "mx-auto flex size-8 items-center justify-center rounded-[calc(var(--radius-sm)+2px)] text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            />
          }
        >
          <HugeiconsIcon icon={Coins01Icon} strokeWidth={2} />
          <span className="sr-only">{credits} credits remaining</span>
        </TooltipTrigger>
        <TooltipContent side="right" align="center">
          {credits} / {creditLimit} credits
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="mx-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-sidebar-foreground/70">
          Credits remaining
        </p>
        <HugeiconsIcon
          icon={Coins01Icon}
          strokeWidth={2}
          className="size-3.5 text-sidebar-foreground/60"
        />
      </div>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
        {credits}
      </p>
      <Progress value={progressValue} className="mt-3 gap-0">
        <ProgressTrack className="h-1.5 bg-sidebar-border">
          <ProgressIndicator className="bg-primary" />
        </ProgressTrack>
      </Progress>
      <p className="mt-1.5 text-xs text-sidebar-foreground/60 tabular-nums">
        {credits} / {creditLimit} credits
      </p>
    </div>
  )
}
