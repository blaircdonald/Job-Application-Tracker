/**
 * Shared across detect + submit so a user never runs two Browserbase
 * automations in parallel (rate limits / session conflicts).
 */
export const AUTO_APPLY_CONCURRENCY = {
  limit: 1,
  key: '"auto-apply-" + event.data.userId',
  scope: "env" as const,
}
