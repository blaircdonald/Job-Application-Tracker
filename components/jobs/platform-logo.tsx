import Image from "next/image"

import { getPlatformConfig } from "@/lib/jobs/platforms"
import type { JobPlatform } from "@/lib/types/database"
import { cn } from "@/lib/utils"

type PlatformLogoProps = {
  platform: JobPlatform
  size?: "sm" | "md" | "lg"
  className?: string
  showName?: boolean
}

const sizeClasses = {
  sm: "size-4",
  md: "size-8",
  lg: "size-10",
}

export function PlatformLogo({
  platform,
  size = "md",
  className,
  showName = false,
}: PlatformLogoProps) {
  const config = getPlatformConfig(platform)

  if (!config) return null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        showName && "rounded-full border bg-background px-2 py-0.5",
        className
      )}
    >
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-background",
          sizeClasses[size]
        )}
      >
        <Image
          src={config.logoSrc}
          alt={`${config.name} logo`}
          fill
          className="object-contain p-0.5"
          sizes={size === "sm" ? "16px" : size === "md" ? "32px" : "40px"}
        />
      </span>
      {showName && (
        <span className="text-xs font-medium">{config.name}</span>
      )}
    </span>
  )
}
