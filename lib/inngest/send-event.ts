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

export async function sendApplicationEvent(event: ApplicationEvents): Promise<void> {
  try {
    await inngest.send(event)
    return
  } catch (error) {
    if (!isInngestDevMode()) {
      throw error
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
