export const ACCEPTED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const

export const MAX_RESUME_SIZE = 5 * 1024 * 1024 // 5 MB

export const ACCEPTED_RESUME_EXTENSIONS = [".pdf", ".docx"] as const
