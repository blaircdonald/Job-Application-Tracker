import type { PlatformAdapter } from "@/lib/automation/platforms/types"
import * as greenhouse from "@/lib/automation/platforms/greenhouse"
import * as lever from "@/lib/automation/platforms/lever"
import * as workable from "@/lib/automation/platforms/workable"
import * as wellfound from "@/lib/automation/platforms/wellfound"
import type { JobPlatform } from "@/lib/types/database"

const adapters: Partial<Record<JobPlatform, PlatformAdapter>> = {
  greenhouse: {
    platform: "greenhouse",
    detectFields: greenhouse.detectFields,
    fillAndSubmit: greenhouse.fillAndSubmit,
  },
  lever: {
    platform: "lever",
    detectFields: lever.detectFields,
    fillAndSubmit: lever.fillAndSubmit,
  },
  workable: {
    platform: "workable",
    detectFields: workable.detectFields,
    fillAndSubmit: workable.fillAndSubmit,
  },
  wellfound: {
    platform: "wellfound",
    detectFields: wellfound.detectFields,
    fillAndSubmit: wellfound.fillAndSubmit,
  },
}

export function getPlatformAdapter(platform: JobPlatform): PlatformAdapter {
  const adapter = adapters[platform]
  if (!adapter) {
    throw new Error(`No automation adapter for platform: ${platform}`)
  }
  return adapter
}
