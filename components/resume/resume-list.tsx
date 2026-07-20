"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { Delete02Icon, Download01Icon } from "@hugeicons/core-free-icons"

import {
  deleteResume,
  getResumeDownloadUrl,
} from "@/app/actions/resume"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Resume } from "@/lib/types/database"

type ResumeListProps = {
  resumes: Resume[]
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusVariant(
  status: Resume["parse_status"]
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "parsed":
      return "default"
    case "processing":
    case "pending":
      return "secondary"
    case "failed":
      return "destructive"
    default:
      return "outline"
  }
}

export function ResumeList({ resumes }: ResumeListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDownload(resumeId: string) {
    startTransition(async () => {
      const result = await getResumeDownloadUrl(resumeId)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      window.open(result.url, "_blank", "noopener,noreferrer")
    })
  }

  function handleDelete(resumeId: string) {
    startTransition(async () => {
      const result = await deleteResume(resumeId)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Resume deleted")
      router.refresh()
    })
  }

  if (resumes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No resumes yet</CardTitle>
          <CardDescription>
            Upload your first resume to get started.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your resumes</CardTitle>
        <CardDescription>
          {resumes.length} resume{resumes.length === 1 ? "" : "s"} uploaded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resumes.map((resume) => (
              <TableRow key={resume.id}>
                <TableCell className="font-medium">
                  {resume.original_filename}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(resume.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>{formatFileSize(resume.file_size)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(resume.parse_status)}>
                    {resume.parse_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => handleDownload(resume.id)}
                    >
                      <HugeiconsIcon icon={Download01Icon} strokeWidth={2} />
                      <span className="sr-only">Download</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={isPending}
                      onClick={() => handleDelete(resume.id)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
