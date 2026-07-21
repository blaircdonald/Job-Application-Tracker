"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"
import { JOB_PLATFORMS } from "@/lib/jobs/platforms"
import type { JobPlatform } from "@/lib/types/database"
import { Check } from "lucide-react"

type PlatformCardsProps = {
  selected: JobPlatform[]
  onChange: (platforms: JobPlatform[]) => void
  disabled?: boolean
}

export function PlatformCards({
  selected,
  onChange,
  disabled = false,
}: PlatformCardsProps) {
  function togglePlatform(platform: JobPlatform) {
    if (disabled) return

    if (selected.includes(platform)) {
      if (selected.length === 1) return
      onChange(selected.filter((item) => item !== platform))
      return
    }

    onChange([...selected, platform])
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-medium">Job platforms</h2>
        <p className="text-xs text-muted-foreground">
          Select platforms to include in your search
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {JOB_PLATFORMS.map((platform) => {
          const isSelected = selected.includes(platform.id)

          return (
            <button
              key={platform.id}
              type="button"
              disabled={disabled}
              onClick={() => togglePlatform(platform.id)}
              className={cn(
                "relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isSelected ? platform.selectedClass : platform.accentClass
              )}
            >
              {isSelected && (
                <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-3" />
                </span>
              )}
              <div className="relative size-10 overflow-hidden rounded-lg border bg-background">
                <Image
                  src={platform.logoSrc}
                  alt={`${platform.name} logo`}
                  fill
                  className="object-contain p-1.5"
                  sizes="40px"
                />
              </div>
              <span className="text-sm font-semibold">{platform.name}</span>
              <span className="text-xs text-muted-foreground">
                {platform.description}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
