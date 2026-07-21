"use client"

import { formatDistanceToNow } from "date-fns"
import { Bookmark, Briefcase, RefreshCw } from "lucide-react"

import type { RecentActivityItem } from "@/lib/jobs/queries"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type RecentActivityCardProps = {
  activities: RecentActivityItem[]
}

function ActivityIcon({ type }: { type: RecentActivityItem["type"] }) {
  switch (type) {
    case "saved":
      return <Bookmark className="size-3.5" />
    case "applied":
      return <Briefcase className="size-3.5" />
    case "fetched":
      return <RefreshCw className="size-3.5" />
  }
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Recent activity</CardTitle>
        <CardDescription>Your latest job search actions</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Save jobs or refresh matches to see activity here.
          </p>
        ) : (
          <ul className="space-y-3">
            {activities.map((activity) => (
              <li key={activity.id} className="flex gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
                    activity.type === "saved" && "bg-primary/10 text-primary",
                    activity.type === "applied" && "bg-emerald-500/10 text-emerald-600"
                  )}
                >
                  <ActivityIcon type={activity.type} />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs leading-snug">{activity.label}</p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
