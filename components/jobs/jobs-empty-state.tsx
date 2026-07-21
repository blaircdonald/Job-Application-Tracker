"use client"

import { Briefcase, RefreshCw } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type JobsEmptyStateProps = {
  onRefresh?: () => void
  isRefreshing?: boolean
}

export function JobsEmptyState({
  onRefresh,
  isRefreshing = false,
}: JobsEmptyStateProps) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Briefcase />
        </EmptyMedia>
        <EmptyTitle>No job matches yet</EmptyTitle>
        <EmptyDescription>
          Complete your profile with skills, experience, and location, then
          search across your selected platforms to discover tailored roles.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex flex-wrap justify-center gap-2">
          {onRefresh && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isRefreshing}
              onClick={onRefresh}
            >
              <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
              Search again
            </Button>
          )}
          <a href="/dashboard/profile" className={buttonVariants({ size: "sm" })}>
            Complete profile
          </a>
        </div>
      </EmptyContent>
    </Empty>
  )
}
