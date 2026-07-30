import type { ApplicationStatus } from "@/lib/types/database"

export function isTerminalApplicationStatus(status: ApplicationStatus): boolean {
  return status === "submitted" || status === "failed"
}

export function isActiveApplicationStatus(status: ApplicationStatus): boolean {
  return !isTerminalApplicationStatus(status)
}

export function getApplicationStatusLabel(status: ApplicationStatus): string {
  switch (status) {
    case "queued":
      return "Queued"
    case "detecting_fields":
      return "Detecting fields"
    case "missing_profile_info":
      return "Missing profile info"
    case "ready_to_submit":
      return "Ready to submit"
    case "submitting":
      return "Submitting"
    case "submitted":
      return "Submitted"
    case "failed":
      return "Failed"
    default:
      return status
  }
}

export function getApplicationStatusVariant(
  status: ApplicationStatus
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "submitted":
      return "default"
    case "failed":
    case "missing_profile_info":
      return "destructive"
    case "queued":
    case "ready_to_submit":
      return "outline"
    default:
      return "secondary"
  }
}
