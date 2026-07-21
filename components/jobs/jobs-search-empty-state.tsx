"use client"

import { SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type JobsSearchEmptyStateProps = {
  query: string
  onClear: () => void
}

export function JobsSearchEmptyState({
  query,
  onClear,
}: JobsSearchEmptyStateProps) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>No jobs match your search</EmptyTitle>
        <EmptyDescription>
          Nothing matched &ldquo;{query}&rdquo;. Try a different job title,
          company, location, or skill.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button type="button" size="sm" variant="outline" onClick={onClear}>
          Clear search
        </Button>
      </EmptyContent>
    </Empty>
  )
}
