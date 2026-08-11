import type { ApplicationEvents } from "@/lib/inngest/client"
import { inngest, isInngestDevMode } from "@/lib/inngest/client"

const DEV_SERVER_URL = "http://127.0.0.1:8288"

async function sendViaDevServer(event: ApplicationEvents): Promise<boolean> {
  const eventKey = process.env.INNGEST_EVENT_KEY ?? "local"

  try {
    const response = await fetch(`${DEV_SERVER_URL}/e/${eventKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: event.name,
        data: event.data,
      }),
      signal: AbortSignal.timeout(5_000),
    })

    return response.ok
  } catch {
    return false
  }
}

function formatSendError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error)

  if (/401|event key not found|invalid event key/i.test(message)) {
    return new Error(
      "Auto-apply couldn’t start because Inngest is misconfigured. Set a real INNGEST_EVENT_KEY on Vercel (not “local”), then redeploy."
    )
  }

  if (/signing key/i.test(message)) {
    return new Error(
      "Auto-apply couldn’t start because Inngest signing is misconfigured. Set a real INNGEST_SIGNING_KEY on Vercel, then redeploy."
    )
  }

  return error instanceof Error ? error : new Error(message)
}

export async function sendApplicationEvent(event: ApplicationEvents): Promise<void> {
  try {
    await inngest.send(event)
    return
  } catch (error) {
    if (!isInngestDevMode()) {
      throw formatSendError(error)
    }

    const sentViaDevServer = await sendViaDevServer(event)
    if (sentViaDevServer) {
      return
    }

    throw new Error(
      "Auto-apply couldn’t start right now. Please try again in a moment."
    )
  }
}
