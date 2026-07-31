"use client"

import { Bookmark, Briefcase, DollarSign, Home, MapPin } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { toggleSaveJob } from "@/app/actions/jobs"
import { ApplyMethodDialog } from "@/components/jobs/apply-method-dialog"
import { PlatformLogo } from "@/components/jobs/platform-logo"
import { resolveJobDisplay } from "@/lib/jobs/display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Job } from "@/lib/types/database"
import { cn } from "@/lib/utils"

type JobCardProps = {
  job: Job
  onSavedChange?: (jobId: string, saved: boolean) => void
  onAppliedChange?: (jobId: string) => void
}

const MAX_VISIBLE_TAGS = 3

function getMatchMeta(score: number) {
  if (score >= 80) {
    return {
      label: "Excellent match",
      textClass: "text-emerald-600 dark:text-emerald-400",
      barClass: "bg-emerald-500",
    }
  }
  if (score >= 60) {
    return {
      label: "Good match",
      textClass: "text-primary",
      barClass: "bg-primary",
    }
  }
  if (score >= 40) {
    return {
      label: "Fair match",
      textClass: "text-amber-600 dark:text-amber-400",
      barClass: "bg-amber-500",
    }
  }
  return {
    label: "Low match",
    textClass: "text-muted-foreground",
    barClass: "bg-muted-foreground",
  }
}

function formatExperienceLevel(level: string) {
  return level
    .split(/[-_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

function MetadataItem({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <Icon className="size-3.5 shrink-0" />
      {children}
    </span>
  )
}

export function JobCard({ job, onSavedChange, onAppliedChange }: JobCardProps) {
  const [isPending, startTransition] = useTransition()
  const [applyDialogOpen, setApplyDialogOpen] = useState(false)
  const match = getMatchMeta(job.match_score)
  const visibleTags = job.tags.slice(0, MAX_VISIBLE_TAGS)
  const hiddenTagCount = job.tags.length - visibleTags.length
  const { title, company } = resolveJobDisplay(job)

  function handleSave() {
    const nextSaved = !job.saved_status

    startTransition(async () => {
      const result = await toggleSaveJob(job.id, nextSaved)
      if (result.success) {
        onSavedChange?.(job.id, result.saved)
        toast.success(result.saved ? "Job saved" : "Job removed from saved")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:gap-8">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-background">
            {job.company_logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={job.company_logo}
                alt=""
                className="size-10 object-contain"
              />
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {(company ?? title).charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-0.5">
              <h3 className="text-base font-semibold leading-snug text-foreground">
                {title}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {company ?? "Company not listed"}
                </p>
                <PlatformLogo platform={job.platform} size="sm" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {job.job_type && (
                <MetadataItem icon={Home}>{job.job_type}</MetadataItem>
              )}
              {job.salary && (
                <MetadataItem icon={DollarSign}>{job.salary}</MetadataItem>
              )}
              {job.experience_level && (
                <MetadataItem icon={Briefcase}>
                  {formatExperienceLevel(job.experience_level)}
                </MetadataItem>
              )}
              {job.location && (
                <MetadataItem icon={MapPin}>{job.location}</MetadataItem>
              )}
            </div>

            {job.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {visibleTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="rounded-full px-2.5 py-0.5 font-normal"
                  >
                    {tag}
                  </Badge>
                ))}
                {hiddenTagCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2.5 py-0.5 font-normal"
                  >
                    +{hiddenTagCount}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-4 sm:flex-row sm:items-center xl:w-auto xl:gap-8">
          <div className="w-full min-w-[140px] space-y-1.5 sm:w-36">
            <p className="text-sm font-semibold tabular-nums">
              {job.match_score}% Match
            </p>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", match.barClass)}
                style={{ width: `${job.match_score}%` }}
              />
            </div>
            <p className={cn("text-xs font-medium", match.textClass)}>
              {match.label}
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-36">
            <Button
              type="button"
              className="h-9 w-full justify-center text-sm"
              onClick={() => setApplyDialogOpen(true)}
            >
              Apply
            </Button>
            <ApplyMethodDialog
              job={job}
              open={applyDialogOpen}
              onOpenChange={setApplyDialogOpen}
              onApplied={() => onAppliedChange?.(job.id)}
            />
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full justify-center text-sm"
              disabled={isPending}
              onClick={handleSave}
            >
              <Bookmark
                className={cn("size-3.5", job.saved_status && "fill-current")}
              />
              {job.saved_status ? "Saved" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
