import { z } from "zod"

export const parsedProfileSchema = z.object({
  fullName: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  githubUrl: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  professionalSummary: z.string().nullable().optional(),
})

export const parsedWorkExperienceSchema = z.object({
  company: z.string(),
  title: z.string(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isCurrent: z.boolean().optional().default(false),
  responsibilities: z.array(z.string()).optional().default([]),
})

export const parsedEducationSchema = z.object({
  institution: z.string(),
  degree: z.string().nullable().optional(),
  fieldOfStudy: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export const parsedProjectSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  technologies: z.array(z.string()).optional().default([]),
})

export const parsedCertificationSchema = z.object({
  name: z.string(),
  issuer: z.string().nullable().optional(),
  issueDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  credentialUrl: z.string().nullable().optional(),
})

export const parsedLinkSchema = z.object({
  label: z.string(),
  url: z.string(),
})

export const parsedResumeSchema = z.object({
  profile: parsedProfileSchema.optional().default({}),
  skills: z.array(z.string()).optional().default([]),
  workExperiences: z.array(parsedWorkExperienceSchema).optional().default([]),
  education: z.array(parsedEducationSchema).optional().default([]),
  projects: z.array(parsedProjectSchema).optional().default([]),
  certifications: z.array(parsedCertificationSchema).optional().default([]),
  links: z.array(parsedLinkSchema).optional().default([]),
})

export type ParsedResume = z.infer<typeof parsedResumeSchema>
export type ParsedProfile = z.infer<typeof parsedProfileSchema>
export type ParsedWorkExperience = z.infer<typeof parsedWorkExperienceSchema>
export type ParsedEducation = z.infer<typeof parsedEducationSchema>
export type ParsedProject = z.infer<typeof parsedProjectSchema>
export type ParsedCertification = z.infer<typeof parsedCertificationSchema>
export type ParsedLink = z.infer<typeof parsedLinkSchema>
