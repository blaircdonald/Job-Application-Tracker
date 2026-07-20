"use client"

import {
  calculateProfileCompleteness,
  getProgressColors,
  getProgressMessage,
  getSectionCompleteness,
} from "@/lib/profile/completeness"
import type { ProfileFormData } from "@/lib/types/database"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type ProfileCompletenessCardProps = {
  data: ProfileFormData
  className?: string
}

function CircularProgress({
  value,
  strokeClassName,
  size = 128,
}: {
  value: number
  strokeClassName: string
  size?: number
}) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-all duration-500", strokeClassName)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{value}%</span>
        <span className="text-[0.625rem] text-muted-foreground">complete</span>
      </div>
    </div>
  )
}

export function ProfileCompletenessCard({
  data,
  className,
}: ProfileCompletenessCardProps) {
  const percentage = calculateProfileCompleteness(data)
  const colors = getProgressColors(percentage)
  const sections = getSectionCompleteness(data)
  const completedCount = sections.filter((section) => section.complete).length

  return (
    <Card className={cn("ring-1", colors.ring, className)}>
      <CardHeader className="pb-3">
        <CardTitle>Profile completeness</CardTitle>
        <CardDescription>{getProgressMessage(percentage)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex justify-center">
          <CircularProgress
            value={percentage}
            strokeClassName={colors.stroke}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Sections completed</span>
            <Badge variant="secondary" className={colors.badge}>
              {completedCount}/{sections.length}
            </Badge>
          </div>
          <ul className="space-y-1.5">
            {sections.map((section) => (
              <li
                key={section.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">{section.label}</span>
                <span
                  className={cn(
                    "font-medium",
                    section.complete ? colors.text : "text-muted-foreground"
                  )}
                >
                  {section.complete ? "Done" : "Missing"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
