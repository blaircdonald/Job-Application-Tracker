"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Briefcase01Icon,
  Certificate01Icon,
  CodeFolderIcon,
  Delete02Icon,
  GraduationScrollIcon,
  Link01Icon,
  Note01Icon,
  StarIcon,
  User03Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

import { updateProfile } from "@/app/actions/profile"
import { PendingApplicationBanner } from "@/components/profile/pending-application-banner"
import { ProfileCompletenessCard } from "@/components/profile/profile-completeness-card"
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { ProfileSectionId } from "@/lib/profile/completeness"
import { getSectionCompleteness } from "@/lib/profile/completeness"
import type { ProfileFormData, JobApplicationWithJob } from "@/lib/types/database"

type ProfileFormProps = {
  initialData: ProfileFormData
  pendingApplication?: JobApplicationWithJob | null
  highlightProfileKeys?: string[]
}

function highlightInputClass(
  profileKey: string,
  highlightProfileKeys?: string[]
) {
  const shouldHighlight =
    highlightProfileKeys?.includes(profileKey) ||
    (profileKey === "fullName" &&
      (highlightProfileKeys?.includes("firstName") ||
        highlightProfileKeys?.includes("lastName")))

  return shouldHighlight
    ? "border-destructive ring-2 ring-destructive/20"
    : undefined
}

type ProfileSection = {
  id: ProfileSectionId
  label: string
  description: string
  icon: IconSvgElement
}

const PROFILE_SECTIONS: ProfileSection[] = [
  {
    id: "personal",
    label: "Personal info",
    description: "Contact details and social profiles",
    icon: User03Icon,
  },
  {
    id: "summary",
    label: "Summary",
    description: "Professional overview",
    icon: Note01Icon,
  },
  {
    id: "skills",
    label: "Skills",
    description: "Technical and soft skills",
    icon: StarIcon,
  },
  {
    id: "experience",
    label: "Work experience",
    description: "Roles, companies, and impact",
    icon: Briefcase01Icon,
  },
  {
    id: "education",
    label: "Education",
    description: "Degrees and institutions",
    icon: GraduationScrollIcon,
  },
  {
    id: "projects",
    label: "Projects",
    description: "Portfolio and side projects",
    icon: CodeFolderIcon,
  },
  {
    id: "certifications",
    label: "Certifications",
    description: "Credentials and awards",
    icon: Certificate01Icon,
  },
  {
    id: "links",
    label: "Links",
    description: "Portfolio and other URLs",
    icon: Link01Icon,
  },
]

const emptyWorkExperience = (): ProfileFormData["workExperiences"][number] => ({
  company: "",
  title: "",
  startDate: "",
  endDate: "",
  isCurrent: false,
  responsibilities: [""],
})

const emptyEducation = (): ProfileFormData["education"][number] => ({
  institution: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  description: "",
})

const emptyProject = (): ProfileFormData["projects"][number] => ({
  name: "",
  description: "",
  url: "",
  technologies: [],
})

const emptyCertification = (): ProfileFormData["certifications"][number] => ({
  name: "",
  issuer: "",
  issueDate: "",
  expiryDate: "",
  credentialUrl: "",
})

const emptyLink = (): ProfileFormData["links"][number] => ({
  label: "",
  url: "",
})

function SectionDropdown({
  value,
  onChange,
  sections,
  completeness,
}: {
  value: ProfileSectionId
  onChange: (value: ProfileSectionId) => void
  sections: ProfileSection[]
  completeness: ReturnType<typeof getSectionCompleteness>
}) {
  return (
    <div className="w-full">
      <Field>
        <FieldLabel htmlFor="profile-section">Jump to section</FieldLabel>
        <NativeSelect
          id="profile-section"
          className="w-full"
          value={value}
          onChange={(event) =>
            onChange(event.target.value as ProfileSectionId)
          }
        >
          {sections.map((section) => {
            const status = completeness.find((item) => item.id === section.id)
            return (
              <NativeSelectOption key={section.id} value={section.id}>
                {section.label}
                {status?.complete ? " ✓" : ""}
              </NativeSelectOption>
            )
          })}
        </NativeSelect>
      </Field>
    </div>
  )
}

function CollapsibleEntry({
  title,
  subtitle,
  defaultOpen = false,
  onRemove,
  children,
}: {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  onRemove: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border">
      <div className="flex items-center gap-2 p-3">
        <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-left">
          <HugeiconsIcon
            icon={open ? ArrowUp01Icon : ArrowDown01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 text-muted-foreground"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{title}</p>
            {subtitle ? (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </CollapsibleTrigger>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
      <CollapsibleContent className="border-t px-4 pb-4 pt-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function ProfileForm({
  initialData,
  pendingApplication = null,
  highlightProfileKeys = [],
}: ProfileFormProps) {
  const [form, setForm] = useState<ProfileFormData>(initialData)
  const [skillInput, setSkillInput] = useState("")
  const [activeTab, setActiveTab] = useState<ProfileSectionId>("personal")
  const [isPending, startTransition] = useTransition()

  const sectionCompleteness = getSectionCompleteness(form)

  function updateField<K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile(form)
      if (result.success) {
        toast.success("Profile saved successfully")
      } else {
        toast.error(result.error)
      }
    })
  }

  function addSkill() {
    const trimmed = skillInput.trim()
    if (!trimmed || form.skills.includes(trimmed)) return
    updateField("skills", [...form.skills, trimmed])
    setSkillInput("")
  }

  function isSectionComplete(id: ProfileSectionId) {
    return sectionCompleteness.find((section) => section.id === id)?.complete
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and edit your profile. Use tabs or the section dropdown to
            navigate quickly.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isPending} size="default">
          {isPending ? "Saving..." : "Save profile"}
        </Button>
      </div>

      {pendingApplication ? (
        <PendingApplicationBanner application={pendingApplication} />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <ProfileCompletenessCard data={form} />
        </aside>

        <div className="min-w-0 space-y-4">
          <SectionDropdown
            value={activeTab}
            onChange={setActiveTab}
            sections={PROFILE_SECTIONS}
            completeness={sectionCompleteness}
          />

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as ProfileSectionId)}
            orientation="vertical"
            className="gap-4 lg:flex-row"
          >
            <TabsList
              variant="line"
              className="hidden h-auto w-full flex-col items-stretch gap-1 bg-transparent p-0 lg:flex lg:w-52 lg:shrink-0"
            >
              {PROFILE_SECTIONS.map((section) => (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="w-full justify-start gap-2 px-3 py-2 data-active:bg-muted/60"
                >
                  <HugeiconsIcon icon={section.icon} strokeWidth={2} />
                  <span className="flex-1 text-left">{section.label}</span>
                  {isSectionComplete(section.id) ? (
                    <Badge variant="secondary" className="h-4 px-1.5 text-[0.625rem]">
                      ✓
                    </Badge>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="min-w-0 flex-1">
              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={User03Icon} strokeWidth={2} className="size-4" />
                      <div>
                        <CardTitle>Personal information</CardTitle>
                        <CardDescription>
                          Your basic contact and profile details
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <FieldSet>
                      <FieldGroup className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                          <Input
                            id="fullName"
                            value={form.fullName}
                            className={highlightInputClass("fullName", highlightProfileKeys)}
                            onChange={(e) => updateField("fullName", e.target.value)}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="email">Email</FieldLabel>
                          <Input
                            id="email"
                            type="email"
                            value={form.email}
                            className={highlightInputClass("email", highlightProfileKeys)}
                            onChange={(e) => updateField("email", e.target.value)}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="phone">Phone</FieldLabel>
                          <Input
                            id="phone"
                            value={form.phone}
                            className={highlightInputClass("phone", highlightProfileKeys)}
                            onChange={(e) => updateField("phone", e.target.value)}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="location">Location</FieldLabel>
                          <Input
                            id="location"
                            value={form.location}
                            className={highlightInputClass("location", highlightProfileKeys)}
                            onChange={(e) => updateField("location", e.target.value)}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="linkedinUrl">LinkedIn URL</FieldLabel>
                          <Input
                            id="linkedinUrl"
                            value={form.linkedinUrl}
                            className={highlightInputClass("linkedinUrl", highlightProfileKeys)}
                            onChange={(e) => updateField("linkedinUrl", e.target.value)}
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="githubUrl">GitHub URL</FieldLabel>
                          <Input
                            id="githubUrl"
                            value={form.githubUrl}
                            className={highlightInputClass("githubUrl", highlightProfileKeys)}
                            onChange={(e) => updateField("githubUrl", e.target.value)}
                          />
                        </Field>
                        <Field className="sm:col-span-2">
                          <FieldLabel htmlFor="websiteUrl">Website URL</FieldLabel>
                          <Input
                            id="websiteUrl"
                            value={form.websiteUrl}
                            className={highlightInputClass("websiteUrl", highlightProfileKeys)}
                            onChange={(e) => updateField("websiteUrl", e.target.value)}
                          />
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="summary">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={Note01Icon} strokeWidth={2} className="size-4" />
                      <CardTitle>Professional summary</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      rows={6}
                      value={form.professionalSummary}
                      className={highlightInputClass(
                        "professionalSummary",
                        highlightProfileKeys
                      )}
                      onChange={(e) =>
                        updateField("professionalSummary", e.target.value)
                      }
                      placeholder="Brief summary of your professional background..."
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={StarIcon} strokeWidth={2} className="size-4" />
                      <CardTitle>Skills</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {form.skills.map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary"
                        >
                          {skill}
                          <button
                            type="button"
                            className="hover:text-primary/70"
                            onClick={() =>
                              updateField(
                                "skills",
                                form.skills.filter((_, i) => i !== index)
                              )
                            }
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="Add a skill"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addSkill()
                          }
                        }}
                      />
                      <Button type="button" onClick={addSkill}>
                        Add skill
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <HugeiconsIcon icon={Briefcase01Icon} strokeWidth={2} className="mt-0.5 size-4" />
                      <div>
                        <CardTitle>Work experience</CardTitle>
                        <CardDescription>
                          Expand each role to edit details
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        updateField("workExperiences", [
                          ...form.workExperiences,
                          emptyWorkExperience(),
                        ])
                      }
                    >
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                      Add role
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {form.workExperiences.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No work experience added yet.
                      </p>
                    ) : null}
                    {form.workExperiences.map((item, index) => (
                      <CollapsibleEntry
                        key={index}
                        defaultOpen={index === 0}
                        title={item.title || item.company || `Experience ${index + 1}`}
                        subtitle={item.company || "Add company and title"}
                        onRemove={() =>
                          updateField(
                            "workExperiences",
                            form.workExperiences.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <FieldGroup className="grid gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel>Company</FieldLabel>
                            <Input
                              value={item.company}
                              onChange={(e) => {
                                const next = [...form.workExperiences]
                                next[index] = { ...item, company: e.target.value }
                                updateField("workExperiences", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Job title</FieldLabel>
                            <Input
                              value={item.title}
                              onChange={(e) => {
                                const next = [...form.workExperiences]
                                next[index] = { ...item, title: e.target.value }
                                updateField("workExperiences", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Start date</FieldLabel>
                            <Input
                              value={item.startDate}
                              onChange={(e) => {
                                const next = [...form.workExperiences]
                                next[index] = { ...item, startDate: e.target.value }
                                updateField("workExperiences", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>End date</FieldLabel>
                            <Input
                              value={item.endDate}
                              onChange={(e) => {
                                const next = [...form.workExperiences]
                                next[index] = { ...item, endDate: e.target.value }
                                updateField("workExperiences", next)
                              }}
                              disabled={item.isCurrent}
                            />
                          </Field>
                        </FieldGroup>
                        <Field className="mt-4">
                          <FieldLabel>Responsibilities</FieldLabel>
                          <div className="space-y-2">
                            {item.responsibilities.map((bullet, bulletIndex) => (
                              <div key={bulletIndex} className="flex gap-2">
                                <Input
                                  value={bullet}
                                  onChange={(e) => {
                                    const next = [...form.workExperiences]
                                    const responsibilities = [...item.responsibilities]
                                    responsibilities[bulletIndex] = e.target.value
                                    next[index] = { ...item, responsibilities }
                                    updateField("workExperiences", next)
                                  }}
                                  placeholder="Describe an accomplishment or responsibility"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() => {
                                    const next = [...form.workExperiences]
                                    next[index] = {
                                      ...item,
                                      responsibilities: item.responsibilities.filter(
                                        (_, i) => i !== bulletIndex
                                      ),
                                    }
                                    updateField("workExperiences", next)
                                  }}
                                >
                                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                const next = [...form.workExperiences]
                                next[index] = {
                                  ...item,
                                  responsibilities: [...item.responsibilities, ""],
                                }
                                updateField("workExperiences", next)
                              }}
                            >
                              Add bullet
                            </Button>
                          </div>
                        </Field>
                      </CollapsibleEntry>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <HugeiconsIcon icon={GraduationScrollIcon} strokeWidth={2} className="mt-0.5 size-4" />
                      <CardTitle>Education</CardTitle>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        updateField("education", [...form.education, emptyEducation()])
                      }
                    >
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                      Add education
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {form.education.map((item, index) => (
                      <CollapsibleEntry
                        key={index}
                        defaultOpen={index === 0}
                        title={item.institution || `Education ${index + 1}`}
                        subtitle={item.degree || "Add degree details"}
                        onRemove={() =>
                          updateField(
                            "education",
                            form.education.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <FieldGroup className="grid gap-4 sm:grid-cols-2">
                          <Field className="sm:col-span-2">
                            <FieldLabel>Institution</FieldLabel>
                            <Input
                              value={item.institution}
                              onChange={(e) => {
                                const next = [...form.education]
                                next[index] = { ...item, institution: e.target.value }
                                updateField("education", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Degree</FieldLabel>
                            <Input
                              value={item.degree}
                              onChange={(e) => {
                                const next = [...form.education]
                                next[index] = { ...item, degree: e.target.value }
                                updateField("education", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Field of study</FieldLabel>
                            <Input
                              value={item.fieldOfStudy}
                              onChange={(e) => {
                                const next = [...form.education]
                                next[index] = { ...item, fieldOfStudy: e.target.value }
                                updateField("education", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Start date</FieldLabel>
                            <Input
                              value={item.startDate}
                              onChange={(e) => {
                                const next = [...form.education]
                                next[index] = { ...item, startDate: e.target.value }
                                updateField("education", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>End date</FieldLabel>
                            <Input
                              value={item.endDate}
                              onChange={(e) => {
                                const next = [...form.education]
                                next[index] = { ...item, endDate: e.target.value }
                                updateField("education", next)
                              }}
                            />
                          </Field>
                          <Field className="sm:col-span-2">
                            <FieldLabel>Description</FieldLabel>
                            <Textarea
                              rows={3}
                              value={item.description}
                              onChange={(e) => {
                                const next = [...form.education]
                                next[index] = { ...item, description: e.target.value }
                                updateField("education", next)
                              }}
                            />
                          </Field>
                        </FieldGroup>
                      </CollapsibleEntry>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="projects">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <HugeiconsIcon icon={CodeFolderIcon} strokeWidth={2} className="mt-0.5 size-4" />
                      <CardTitle>Projects</CardTitle>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        updateField("projects", [...form.projects, emptyProject()])
                      }
                    >
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                      Add project
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {form.projects.map((item, index) => (
                      <CollapsibleEntry
                        key={index}
                        defaultOpen={index === 0}
                        title={item.name || `Project ${index + 1}`}
                        subtitle={item.url || "Add project details"}
                        onRemove={() =>
                          updateField(
                            "projects",
                            form.projects.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <FieldGroup className="grid gap-4">
                          <Field>
                            <FieldLabel>Name</FieldLabel>
                            <Input
                              value={item.name}
                              onChange={(e) => {
                                const next = [...form.projects]
                                next[index] = { ...item, name: e.target.value }
                                updateField("projects", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>URL</FieldLabel>
                            <Input
                              value={item.url}
                              onChange={(e) => {
                                const next = [...form.projects]
                                next[index] = { ...item, url: e.target.value }
                                updateField("projects", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Technologies (comma-separated)</FieldLabel>
                            <Input
                              value={item.technologies.join(", ")}
                              onChange={(e) => {
                                const next = [...form.projects]
                                next[index] = {
                                  ...item,
                                  technologies: e.target.value
                                    .split(",")
                                    .map((t) => t.trim())
                                    .filter(Boolean),
                                }
                                updateField("projects", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Description</FieldLabel>
                            <Textarea
                              rows={3}
                              value={item.description}
                              onChange={(e) => {
                                const next = [...form.projects]
                                next[index] = { ...item, description: e.target.value }
                                updateField("projects", next)
                              }}
                            />
                          </Field>
                        </FieldGroup>
                      </CollapsibleEntry>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="certifications">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <HugeiconsIcon icon={Certificate01Icon} strokeWidth={2} className="mt-0.5 size-4" />
                      <CardTitle>Certifications</CardTitle>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() =>
                        updateField("certifications", [
                          ...form.certifications,
                          emptyCertification(),
                        ])
                      }
                    >
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                      Add certification
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {form.certifications.map((item, index) => (
                      <CollapsibleEntry
                        key={index}
                        defaultOpen={index === 0}
                        title={item.name || `Certification ${index + 1}`}
                        subtitle={item.issuer || "Add issuer details"}
                        onRemove={() =>
                          updateField(
                            "certifications",
                            form.certifications.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <FieldGroup className="grid gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel>Name</FieldLabel>
                            <Input
                              value={item.name}
                              onChange={(e) => {
                                const next = [...form.certifications]
                                next[index] = { ...item, name: e.target.value }
                                updateField("certifications", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Issuer</FieldLabel>
                            <Input
                              value={item.issuer}
                              onChange={(e) => {
                                const next = [...form.certifications]
                                next[index] = { ...item, issuer: e.target.value }
                                updateField("certifications", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Issue date</FieldLabel>
                            <Input
                              value={item.issueDate}
                              onChange={(e) => {
                                const next = [...form.certifications]
                                next[index] = { ...item, issueDate: e.target.value }
                                updateField("certifications", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>Expiry date</FieldLabel>
                            <Input
                              value={item.expiryDate}
                              onChange={(e) => {
                                const next = [...form.certifications]
                                next[index] = { ...item, expiryDate: e.target.value }
                                updateField("certifications", next)
                              }}
                            />
                          </Field>
                          <Field className="sm:col-span-2">
                            <FieldLabel>Credential URL</FieldLabel>
                            <Input
                              value={item.credentialUrl}
                              onChange={(e) => {
                                const next = [...form.certifications]
                                next[index] = { ...item, credentialUrl: e.target.value }
                                updateField("certifications", next)
                              }}
                            />
                          </Field>
                        </FieldGroup>
                      </CollapsibleEntry>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="links">
                <Card>
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <HugeiconsIcon icon={Link01Icon} strokeWidth={2} className="mt-0.5 size-4" />
                      <div>
                        <CardTitle>Links</CardTitle>
                        <CardDescription>
                          Additional portfolio or profile links
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => updateField("links", [...form.links, emptyLink()])}
                    >
                      <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                      Add link
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {form.links.map((item, index) => (
                      <CollapsibleEntry
                        key={index}
                        defaultOpen={index === 0}
                        title={item.label || `Link ${index + 1}`}
                        subtitle={item.url || "Add label and URL"}
                        onRemove={() =>
                          updateField(
                            "links",
                            form.links.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <FieldGroup className="grid gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel>Label</FieldLabel>
                            <Input
                              placeholder="Portfolio"
                              value={item.label}
                              onChange={(e) => {
                                const next = [...form.links]
                                next[index] = { ...item, label: e.target.value }
                                updateField("links", next)
                              }}
                            />
                          </Field>
                          <Field>
                            <FieldLabel>URL</FieldLabel>
                            <Input
                              placeholder="https://"
                              value={item.url}
                              onChange={(e) => {
                                const next = [...form.links]
                                next[index] = { ...item, url: e.target.value }
                                updateField("links", next)
                              }}
                            />
                          </Field>
                        </FieldGroup>
                      </CollapsibleEntry>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>

          <div className="flex justify-end pb-2">
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
