import type { PlatformAdapter } from "@/lib/automation/platforms/types"
import {
  detectFields as detectGreenhouseFields,
  fillAndSubmit as fillGreenhouse,
} from "@/lib/automation/platforms/greenhouse"
import {
  detectFields as detectLeverFields,
  fillAndSubmit as fillLever,
} from "@/lib/automation/platforms/lever"
import {
  detectFields as detectWorkableFields,
  fillAndSubmit as fillWorkable,
} from "@/lib/automation/platforms/workable"
import {
  detectFields as detectWellfoundFields,
  fillAndSubmit as fillWellfound,
} from "@/lib/automation/platforms/wellfound"
import type { JobPlatform } from "@/lib/types/database"

const adapters: Record<string, PlatformAdapter> = {
  greenhouse: {
    platform: "greenhouse",
    detectFields: detectGreenhouseFields,
    fillAndSubmit: fillGreenhouse,
  },
  lever: {
    platform: "lever",
    detectFields: detectLeverFields,
    fillAndSubmit: fillLever,
  },
  workable: {
    platform: "workable",
    detectFields: detectWorkableFields,
    fillAndSubmit: fillWorkable,
  },
  wellfound: {
    platform: "wellfound",
    detectFields: detectWellfoundFields,
    fillAndSubmit: fillWellfound,
  },
}

export function getPlatformAdapter(platform: JobPlatform): PlatformAdapter {
  const adapter = adapters[platform]
  if (!adapter) {
    throw new Error(`No automation adapter for platform: ${platform}`)
  }
  return adapter
}
