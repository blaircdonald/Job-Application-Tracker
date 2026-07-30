import Link from "next/link"
import { Bot, Briefcase, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Sparkles,
    title: "Smart job matching",
    description:
      "Find roles that fit your skills and experience across major job platforms.",
  },
  {
    icon: Bot,
    title: "AI auto-apply",
    description:
      "Let the agent fill application forms, attach your resume, and submit for you.",
  },
  {
    icon: Briefcase,
    title: "Track everything",
    description:
      "Monitor application status, saved jobs, and progress from one dashboard.",
  },
]

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-background">
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

      <main className="flex flex-1 flex-col">
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

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-card p-6 shadow-sm"
                >
                  <feature.icon className="mb-3 size-5 text-primary" />
                  <h2 className="text-base font-semibold">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
