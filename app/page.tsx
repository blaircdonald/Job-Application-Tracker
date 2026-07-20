import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-6 py-20">
        <div className="max-w-2xl space-y-6">
          <p className="text-sm font-medium text-muted-foreground">
            AI-powered job search
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Apply smarter. Track everything. Land the role.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            AI Job Agent helps you tailor applications, stay organized, and move
            faster through your job search — with secure sign-in and a personal
            dashboard.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" render={<Link href="/sign-up" />}>
              Create free account
            </Button>
            <Button variant="outline" size="lg" render={<Link href="/sign-in" />}>
              Sign in
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
