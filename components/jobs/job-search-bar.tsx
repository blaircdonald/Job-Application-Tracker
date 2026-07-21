"use client"

import { Search, X } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type JobSearchBarProps = {
  value: string
  onChange: (value: string) => void
  resultCount?: number
  className?: string
}

export function JobSearchBar({
  value,
  onChange,
  resultCount,
  className,
}: JobSearchBarProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search jobs by title, company, location, or skills…"
          className="h-10 rounded-xl bg-background pl-9 pr-9 text-sm"
          aria-label="Search jobs"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {value.trim() && resultCount !== undefined && (
        <p className="text-xs text-muted-foreground">
          {resultCount} {resultCount === 1 ? "job" : "jobs"} matching &ldquo;
          {value.trim()}&rdquo;
        </p>
      )}
    </div>
  )
}
