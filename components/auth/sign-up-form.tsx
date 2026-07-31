"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { GoogleAuthButton } from "@/components/auth/google-auth-button"
import { DEFAULT_DASHBOARD_PATH } from "@/components/dashboard/nav-config"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") ?? DEFAULT_DASHBOARD_PATH

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      toast.success("Account created successfully!")
      router.push(redirectTo)
      router.refresh()
      return
    }

    setSuccess(true)
    setLoading(false)
    toast.success("Check your email to confirm your account.")
  }

  if (success) {
    return (
      <div className="space-y-4 rounded-lg border bg-muted/30 p-6 text-center">
        <h3 className="text-sm font-medium">Confirm your email</h3>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Click the
          link to activate your account.
        </p>
        <Link href="/sign-in" className="block">
          <Button variant="outline" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GoogleAuthButton label="Sign up with Google" />

      <FieldSeparator>or sign up with email</FieldSeparator>

      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="fullName">Full name</FieldLabel>
            <Input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Jane Doe"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
              className="h-10"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-10"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
              className="h-10"
            />
            <FieldDescription>Use at least 8 characters.</FieldDescription>
          </Field>

          {error ? <FieldError>{error}</FieldError> : null}

          <Button type="submit" className="h-10 w-full text-sm" disabled={loading}>
            {loading ? <Spinner className="size-4" /> : "Create account"}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/sign-in${redirectTo !== DEFAULT_DASHBOARD_PATH ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
