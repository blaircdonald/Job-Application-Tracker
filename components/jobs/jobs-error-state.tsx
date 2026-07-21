"use client"

import { AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

type JobsErrorStateProps = {
  message: string
  onRetry?: () => void
  isRetrying?: boolean
}

export function JobsErrorState({
  message,
  onRetry,
  isRetrying = false,
}: JobsErrorStateProps) {
  return (
    <Empty className="border border-destructive/30 bg-destructive/5">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertCircle className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>Unable to load jobs</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      {onRetry && (
        <EmptyContent>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isRetrying}
            onClick={onRetry}
          >
            <RefreshCw className={isRetrying ? "animate-spin" : ""} />
            Try again
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
