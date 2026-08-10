const previewJobs = [
  {
    company: "Notion",
    title: "Senior Product Engineer",
    match: 96,
    status: "Applying…",
  },
  {
    company: "Stripe",
    title: "Full Stack Engineer",
    match: 91,
    status: "Matched",
  },
  {
    company: "Linear",
    title: "Platform Engineer",
    match: 88,
    status: "Matched",
  },
] as const

export function HeroProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--primary)_35%,transparent),transparent_55%),radial-gradient(circle_at_80%_70%,color-mix(in_oklab,var(--foreground)_8%,transparent),transparent_50%)]"
      />
      <div
        aria-hidden
        className="landing-grid pointer-events-none absolute inset-0 opacity-40"
      />

      <div className="landing-float relative overflow-hidden rounded-2xl border border-foreground/10 bg-background/80 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <div className="flex items-center gap-2 border-b border-foreground/8 px-4 py-3">
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="size-2.5 rounded-full bg-foreground/15" />
          <span className="ml-3 text-xs text-muted-foreground">
            Job matches · live
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-medium text-foreground">
            <span className="landing-pulse size-1.5 rounded-full bg-primary" />
            Agent active
          </span>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {previewJobs.map((job, index) => (
            <div
              key={job.title}
              className="landing-row flex items-center gap-3 rounded-xl bg-foreground/[0.03] px-3 py-3"
              style={{ animationDelay: `${120 + index * 140}ms` }}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-semibold text-background">
                {job.company.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{job.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {job.company}
                </p>
              </div>
              <div className="hidden shrink-0 text-right sm:block">
                <p className="text-sm font-semibold tabular-nums">
                  {job.match}%
                </p>
                <p className="text-[11px] text-muted-foreground">match</p>
              </div>
              <div className="shrink-0 rounded-md bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-foreground/8">
                {job.status}
              </div>
            </div>
          ))}

          <div className="rounded-xl bg-foreground px-4 py-3 text-background">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-background/70">
                  Auto-apply progress
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  Filling application…
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-primary">
                …
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background/20">
              <div className="landing-progress h-full rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
