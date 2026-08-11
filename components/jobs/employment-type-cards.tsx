"use client"

import { cn } from "@/lib/utils"
import {
  EMPLOYMENT_TYPE_OPTIONS,
} from "@/lib/jobs/search-context"
import type { EmploymentType } from "@/lib/types/database"
import { Check } from "lucide-react"

type EmploymentTypeCardsProps = {
  selected: EmploymentType
  onChange: (employmentType: EmploymentType) => void
  disabled?: boolean
}

export function EmploymentTypeCards({
  selected,
  onChange,
  disabled = false,
}: EmploymentTypeCardsProps) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">Looking for</h2>
        <p className="text-xs text-muted-foreground">
          Choose internship, part-time, or full-time matches
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {EMPLOYMENT_TYPE_OPTIONS.map((option) => {
          const isSelected = selected === option.id

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled && option.id !== selected) {
                  onChange(option.id)
                }
              }}
              className={cn(
                "relative flex flex-col gap-1 rounded-xl border p-4 text-left transition-all",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isSelected
                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                  : "border-border bg-card hover:bg-muted/40"
              )}
            >
              {isSelected && (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </span>
              )}
              <span className="text-sm font-semibold">{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
