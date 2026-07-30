import "server-only"

import { Stagehand } from "@browserbasehq/stagehand"

export function createStagehandConfig(sessionId?: string) {
  const apiKey = process.env.BROWSERBASE_API_KEY
  const projectId = process.env.BROWSERBASE_PROJECT_ID
  const modelApiKey = process.env.GEMINI_API_KEY

  if (!apiKey || !projectId) {
    throw new Error("Missing BROWSERBASE_API_KEY or BROWSERBASE_PROJECT_ID")
  }

  if (!modelApiKey) {
    throw new Error("Missing GEMINI_API_KEY for Stagehand model")
  }

  return {
    env: "BROWSERBASE" as const,
    apiKey,
    projectId,
    model: {
      modelName: "google/gemini-2.0-flash",
      apiKey: modelApiKey,
    },
    verbose: 1 as const,
    ...(sessionId
      ? { browserbaseSessionID: sessionId }
      : {
          browserbaseSessionCreateParams: {
            projectId,
          },
        }),
  }
}

export async function createStagehand(sessionId?: string) {
  const stagehand = new Stagehand(createStagehandConfig(sessionId))
  await stagehand.init()
  return stagehand
}

export type StagehandInstance = Awaited<ReturnType<typeof createStagehand>>
