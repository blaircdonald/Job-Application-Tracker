import Link from "next/link"

import { HeroProductPreview } from "@/components/landing/hero-product-preview"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_45%),radial-gradient(ellipse_at_bottom_left,color-mix(in_oklab,var(--foreground)_5%,transparent),transparent_40%)]"
      />

      <header className="relative border-b border-foreground/8 bg-background/70 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground">
              AI
            </span>
            Job Agent
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" render={<Link href="/sign-in" />}>
              Sign in
            </Button>
            <Button size="sm" render={<Link href="/sign-up" />}>
              Get started
            </Button>
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 py-16 lg:px-10 lg:py-24">
          <div className="grid flex-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-8">
              <p className="text-sm font-medium text-muted-foreground">
                AI-powered job search
              </p>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.1]">
                Apply smarter. Track everything. Land the role.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                AI Job Agent helps you tailor applications, stay organized, and
                move faster through your job search — with secure sign-in and a
                personal dashboard.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" render={<Link href="/sign-up" />}>
                  Create free account
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  render={<Link href="/sign-in" />}
                >
                  Sign in
                </Button>
              </div>
            </div>

            <HeroProductPreview />
          </div>
        </section>
      </main>
    </div>
  )
}
