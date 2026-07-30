"use client"

import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

import { saveMissingApplicationFields } from "@/app/actions/applications"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getFillableMissingFields } from "@/lib/applications/missing-fields-utils"
import {
  getChoiceOptions,
  getFieldInputKind,
} from "@/lib/automation/field-inference"
import type { JobApplicationWithJob, MissingField } from "@/lib/types/database"

type MissingFieldsDialogProps = {
  application: JobApplicationWithJob | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}

function buildInitialValues(application: JobApplicationWithJob | null) {
  if (!application) return {}

  const initial: Record<string, string> = {}

  for (const field of getFillableMissingFields(application.missing_fields)) {
    initial[field.fieldId] =
      application.application_field_values[field.fieldId] ??
      application.application_field_values[field.profileKey] ??
      ""
  }

  return initial
}

function MissingFieldInput({
  field,
  value,
  onChange,
}: {
  field: MissingField
  value: string
  onChange: (value: string) => void
}) {
  const inputKind = getFieldInputKind({
    label: field.label,
    profileKey: field.profileKey,
    fieldType: field.fieldType,
  })

  if (inputKind === "choice") {
    const options = getChoiceOptions(field.label)

    return (
      <Select
        value={value || undefined}
        onValueChange={(nextValue) => onChange(nextValue ?? "")}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (inputKind === "textarea") {
    return (
      <textarea
        id={field.fieldId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="w-full rounded-md border border-input bg-input/20 px-2 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        placeholder={`Enter ${field.label.toLowerCase()}`}
      />
    )
  }

  return (
    <Input
      id={field.fieldId}
      type={inputKind === "text" ? "text" : inputKind}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={`Enter ${field.label.toLowerCase()}`}
    />
  )
}

export function MissingFieldsDialog({
  application,
  open,
  onOpenChange,
  onSaved,
}: MissingFieldsDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const fillableFields = application
    ? getFillableMissingFields(application.missing_fields)
    : []
  const resumeMissing = application?.missing_fields.some(
    (field) => field.profileKey === "resume"
  )

  useEffect(() => {
    if (open && application) {
      setValues(buildInitialValues(application))
    }
  }, [open, application])

  function handleSave() {
    if (!application) return

    startTransition(async () => {
      const result = await saveMissingApplicationFields(application.id, values)

      if (result.success) {
        if (result.stillMissing) {
          toast.success("Saved. Some fields still need attention.")
        } else {
          toast.success("Saved. Continuing your application...")
        }
        onOpenChange(false)
        onSaved?.()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fill missing application fields</DialogTitle>
          <DialogDescription>
            {application
              ? `Answer these required questions for ${application.job.title}${
                  application.job.company ? ` at ${application.job.company}` : ""
                } before the agent submits your application.`
              : "Enter the required information to continue your application."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(60vh,420px)] space-y-4 overflow-y-auto pr-1">
          {fillableFields.map((field) => (
            <div key={field.fieldId} className="space-y-1.5">
              <Label htmlFor={field.fieldId}>{field.label}</Label>
              <MissingFieldInput
                field={field}
                value={values[field.fieldId] ?? ""}
                onChange={(nextValue) =>
                  setValues((current) => ({
                    ...current,
                    [field.fieldId]: nextValue,
                  }))
                }
              />
            </div>
          ))}

          {resumeMissing ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
              A resume upload is required for this application.{" "}
              <Link
                href="/dashboard/resume"
                className="font-medium text-foreground underline underline-offset-2"
              >
                Upload your resume
              </Link>{" "}
              and save again.
            </div>
          ) : null}

          {fillableFields.length === 0 && !resumeMissing ? (
            <p className="text-sm text-muted-foreground">
              No fields need to be filled right now.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || fillableFields.length === 0}
          >
            {isPending ? "Saving..." : "Save & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
