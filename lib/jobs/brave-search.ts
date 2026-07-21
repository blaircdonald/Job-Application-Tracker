import type { JobPlatform } from "@/lib/types/database"

import { getPlatformConfig, isPlatformJobUrl } from "./platforms"
import type { JobSearchContext } from "./search-context"
import { buildPlatformSearchQueries } from "./search-context"

export type BraveWebResult = {
  title: string
  url: string
  description: string
  age?: string
}

type BraveSearchResponse = {
  web?: {
    results?: Array<{
      title?: string
      url?: string
      description?: string
      age?: string
    }>
  }
  message?: string
}

const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search"

function filterPlatformResults(
  results: Array<{
    title?: string
    url?: string
    description?: string
    age?: string
  }> | undefined,
  platform: JobPlatform
) {
  return (results ?? []).filter(
    (result) =>
      result.title &&
      result.url &&
      isPlatformJobUrl(result.url, platform)
  )
}

async function runBraveSearch(
  query: string,
  apiKey: string
): Promise<
  Array<{
    title?: string
    url?: string
    description?: string
    age?: string
  }>
> {
  const params = new URLSearchParams({
    q: query,
    freshness: "pw",
    count: "20",
    search_lang: "en",
    country: "us",
  })

  const response = await fetch(`${BRAVE_SEARCH_URL}?${params}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Brave Search request failed (${response.status}): ${body.slice(0, 300)}`
    )
  }

  const data = (await response.json()) as BraveSearchResponse
  return data.web?.results ?? []
}

export async function searchBraveJobs(
  platform: JobPlatform,
  context: JobSearchContext
): Promise<BraveWebResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY

  if (!apiKey) {
    throw new Error(
      "Brave Search API key is not configured. Set BRAVE_SEARCH_API_KEY in your environment."
    )
  }

  const platformConfig = getPlatformConfig(platform)
  if (!platformConfig) {
    throw new Error(`Unknown platform: ${platform}`)
  }

  const queries = buildPlatformSearchQueries(platform, context)
  const seen = new Set<string>()
  const collected: BraveWebResult[] = []

  for (const query of queries) {
    const results = filterPlatformResults(
      await runBraveSearch(query, apiKey),
      platform
    )

    for (const result of results) {
      if (!result.url || seen.has(result.url)) continue
      seen.add(result.url)
      collected.push({
        title: result.title!,
        url: result.url,
        description: result.description ?? "",
        age: result.age,
      })
    }

    if (collected.length >= 10) break
  }

  return collected
}

export function getBraveSearchQueryPreview(
  platform: JobPlatform,
  context: JobSearchContext
): string {
  return buildPlatformSearchQueries(platform, context).join(" | ")
}
