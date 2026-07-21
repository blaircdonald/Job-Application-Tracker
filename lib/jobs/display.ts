import type { Job } from "@/lib/types/database"

const JOB_TITLE_PATTERN =
  /engineer|developer|manager|architect|designer|analyst|lead|director|specialist|intern|coordinator|consultant|programmer|administrator|associate|executive|officer|pre-sales|presales/i

function looksLikeJobTitle(value: string) {
  return JOB_TITLE_PATTERN.test(value)
}

export function resolveJobDisplay(job: Job): {
  title: string
  company: string | null
} {
  const { title, company } = job

  if (
    company &&
    looksLikeJobTitle(company) &&
    !looksLikeJobTitle(title) &&
    company.length > title.length
  ) {
    return { title: company, company: title }
  }

  return { title, company }
}
