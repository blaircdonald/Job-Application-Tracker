import type { JobPlatform } from "@/lib/types/database"

import type { BraveWebResult } from "./brave-search"

export type ParsedJobMetadata = {
  title: string
  company: string | null
  postedAt: string | null
}

const PLATFORM_SUFFIX =
  /\s*[\|–—-]\s*(Greenhouse|Lever|Workable|Wellfound|LinkedIn|Indeed|AngelList|Apply).*$/i

const INDEED_SUFFIX = /\s*-\s*(?:Remote\s*-\s*)?Indeed\.com.*$/i

function formatSlugAsName(slug: string): string {
  return slug
    .replace(/-\d{5,}$/, "")
    .replace(/-at-/i, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function extractCompanyFromGreenhouseUrl(url: string): string | null {
  const match = url.match(/greenhouse\.io\/([^/]+)\/jobs/i)
  return match ? formatSlugAsName(match[1]) : null
}

function extractCompanyFromLeverUrl(url: string): string | null {
  const match = url.match(/jobs\.lever\.co\/([^/]+)\//i)
  return match ? formatSlugAsName(match[1]) : null
}

function parseGreenhouseTitle(rawTitle: string, url: string): ParsedJobMetadata {
  const applicationMatch = rawTitle.match(
    /^Job Application for (.+?) at (.+?)(?:\s*-\s*\w{2,3})?\s*$/i
  )

  if (applicationMatch) {
    return {
      title: applicationMatch[1].trim(),
      company: applicationMatch[2].trim(),
      postedAt: null,
    }
  }

  const company = extractCompanyFromGreenhouseUrl(url)
  let title = rawTitle
    .replace(/^Job Application for\s+/i, "")
    .replace(PLATFORM_SUFFIX, "")
    .trim()

  if (company) {
    title = title.replace(new RegExp(`\\s*at\\s+${company}.*$`, "i"), "").trim()
  }

  title = title.replace(/\s*-\s*$/, "").trim()

  return { title: title || rawTitle.trim(), company, postedAt: null }
}

function looksLikeJobTitle(value: string) {
  return /engineer|developer|manager|architect|designer|analyst|lead|director|specialist|intern|coordinator|consultant|programmer|administrator|associate|executive|officer|pre-sales|presales/i.test(
    value
  )
}

function normalizeTitleCompanyOrder(
  parsed: ParsedJobMetadata,
  url: string
): ParsedJobMetadata {
  const urlCompany = extractCompanyFromUrl(url)

  if (
    urlCompany &&
    parsed.title.toLowerCase() === urlCompany.toLowerCase() &&
    parsed.company
  ) {
    return {
      ...parsed,
      title: parsed.company,
      company: urlCompany,
    }
  }

  if (
    parsed.company &&
    parsed.title &&
    looksLikeJobTitle(parsed.company) &&
    !looksLikeJobTitle(parsed.title) &&
    parsed.company.length > parsed.title.length
  ) {
    return {
      ...parsed,
      title: parsed.company,
      company: parsed.title,
    }
  }

  if (
    parsed.company &&
    parsed.title &&
    urlCompany &&
    parsed.title.toLowerCase() === urlCompany.toLowerCase()
  ) {
    return {
      ...parsed,
      title: parsed.company,
      company: urlCompany,
    }
  }

  return parsed
}

function parseLeverTitle(rawTitle: string, url: string): ParsedJobMetadata {
  const companyFromUrl = extractCompanyFromLeverUrl(url)
  const parts = rawTitle.split(/\s*-\s*/)

  if (parts.length >= 2) {
    const first = parts[0].trim()
    const rest = parts.slice(1).join(" - ").trim()

    if (companyFromUrl) {
      if (first.toLowerCase() === companyFromUrl.toLowerCase()) {
        return { title: rest, company: companyFromUrl, postedAt: null }
      }
      if (rest.toLowerCase() === companyFromUrl.toLowerCase()) {
        return { title: first, company: companyFromUrl, postedAt: null }
      }
      return { title: rest, company: companyFromUrl, postedAt: null }
    }

    return first.length <= rest.length
      ? { title: rest, company: first, postedAt: null }
      : { title: first, company: rest, postedAt: null }
  }

  return {
    title: rawTitle.replace(PLATFORM_SUFFIX, "").trim(),
    company: companyFromUrl,
    postedAt: null,
  }
}

function parseIndeedTitle(
  rawTitle: string,
  description: string,
  url: string
): ParsedJobMetadata {
  let title = rawTitle
    .replace(INDEED_SUFFIX, "")
    .replace(/\s*-\s*Remote\s*$/i, "")
    .replace(PLATFORM_SUFFIX, "")
    .trim()

  const descMatch = description.match(
    /Apply for the (.+?)(?:\s+remote)? job!/i
  )
  if (descMatch) {
    title = descMatch[1].trim()
  }

  return {
    title,
    company: extractCompanyFromUrl(url),
    postedAt: null,
  }
}

function parseGenericTitle(rawTitle: string, url: string): ParsedJobMetadata {
  let title = rawTitle.replace(PLATFORM_SUFFIX, "").trim()
  let company: string | null = null
  const companyFromUrl = extractCompanyFromUrl(url)

  const atMatch = title.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i)
  if (atMatch) {
    return {
      title: atMatch[1].trim(),
      company: atMatch[2].split(/[|\-–—]/)[0]?.trim() ?? companyFromUrl,
      postedAt: null,
    }
  }

  const dashMatch = title.match(/^(.+?)\s*-\s*(.+)$/)
  if (dashMatch) {
    const first = dashMatch[1].trim()
    const second = dashMatch[2].trim()

    if (companyFromUrl) {
      if (first.toLowerCase() === companyFromUrl.toLowerCase()) {
        return { title: second, company: companyFromUrl, postedAt: null }
      }
      if (second.toLowerCase() === companyFromUrl.toLowerCase()) {
        return { title: first, company: companyFromUrl, postedAt: null }
      }
      return second.length >= first.length
        ? { title: second, company: companyFromUrl, postedAt: null }
        : { title: first, company: companyFromUrl, postedAt: null }
    }

    if (
      looksLikeJobTitle(second) ||
      (second.length > first.length && !looksLikeJobTitle(first))
    ) {
      return { title: second, company: first, postedAt: null }
    }

    return { title: first, company: second, postedAt: null }
  }

  return {
    title,
    company: companyFromUrl,
    postedAt: null,
  }
}

function extractCompanyFromUrl(url: string): string | null {
  return (
    extractCompanyFromGreenhouseUrl(url) ??
    extractCompanyFromLeverUrl(url) ??
    extractCompanyFromGenericUrl(url)
  )
}

function extractCompanyFromGenericUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "")
    const subdomain = hostname.split(".")[0]
    if (
      !subdomain ||
      ["jobs", "job-boards", "boards", "apply", "www"].includes(subdomain)
    ) {
      return null
    }
    return formatSlugAsName(subdomain)
  } catch {
    return null
  }
}

export function parsePostedAt(
  age?: string,
  description?: string
): string | null {
  const candidates = [age, description].filter(Boolean) as string[]

  for (const value of candidates) {
    const isoMatch = value.match(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/
    )
    if (isoMatch) {
      const parsed = new Date(isoMatch[0])
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString()
      }
    }

    const relativeMatch = value.match(
      /(\d+)\s*(second|minute|hour|day|week|month|year)s?\s+ago/i
    )
    if (relativeMatch) {
      const amount = Number.parseInt(relativeMatch[1], 10)
      const unit = relativeMatch[2].toLowerCase()
      const date = new Date()

      switch (unit) {
        case "second":
          date.setSeconds(date.getSeconds() - amount)
          break
        case "minute":
          date.setMinutes(date.getMinutes() - amount)
          break
        case "hour":
          date.setHours(date.getHours() - amount)
          break
        case "day":
          date.setDate(date.getDate() - amount)
          break
        case "week":
          date.setDate(date.getDate() - amount * 7)
          break
        case "month":
          date.setMonth(date.getMonth() - amount)
          break
        case "year":
          date.setFullYear(date.getFullYear() - amount)
          break
      }

      return date.toISOString()
    }

    if (/yesterday/i.test(value)) {
      const date = new Date()
      date.setDate(date.getDate() - 1)
      return date.toISOString()
    }
  }

  return null
}

export function parseJobMetadata(
  result: BraveWebResult,
  platform: JobPlatform
): ParsedJobMetadata {
  const rawTitle = result.title.trim()
  let parsed: ParsedJobMetadata

  switch (platform) {
    case "greenhouse":
      parsed = parseGreenhouseTitle(rawTitle, result.url)
      break
    case "lever":
      parsed = parseLeverTitle(rawTitle, result.url)
      break
    case "indeed":
      parsed = parseIndeedTitle(rawTitle, result.description, result.url)
      break
    default:
      parsed = parseGenericTitle(rawTitle, result.url)
  }

  parsed.postedAt = parsePostedAt(result.age, result.description)
  parsed = normalizeTitleCompanyOrder(parsed, result.url)

  if (!parsed.title || parsed.title.length < 2) {
    parsed.title = rawTitle.replace(PLATFORM_SUFFIX, "").trim() || rawTitle
  }

  if (parsed.company) {
    parsed.company = parsed.company.replace(/\s*-\s*\w{2,3}$/, "").trim()
  }

  return parsed
}
