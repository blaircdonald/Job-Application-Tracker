import Link from "next/link"

export function AuthLayout({
  children,
  title,
  description,
}: {
  children: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.45_0.12_260),transparent_55%),radial-gradient(circle_at_bottom_right,oklch(0.35_0.08_200),transparent_50%)]"
        />
        <div className="relative">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-white"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold ring-1 ring-white/20">
              AI
            </span>
            Job Agent
          </Link>
        </div>
        <div className="relative space-y-4">
          <h1 className="max-w-md text-3xl font-semibold tracking-tight text-white">
            Land your next role with an AI-powered application assistant.
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
            Tailor resumes, track applications, and stay organized — all in one
            place.
          </p>
        </div>
        <p className="relative text-xs text-zinc-500">
          Secure authentication powered by Supabase
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="mb-8 flex w-full max-w-sm items-center justify-between lg:hidden">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              AI
            </span>
            Job Agent
          </Link>
        </div>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5 text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
