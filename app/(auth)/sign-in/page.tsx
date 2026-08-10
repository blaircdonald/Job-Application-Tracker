import { Suspense } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { SignInForm } from "@/components/auth/sign-in-form"
import { Spinner } from "@/components/ui/spinner"

export const metadata = {
  title: "Sign In | AI Job Agent",
  description: "Sign in to your AI Job Agent account",
}

function SignInFormFallback() {
  return (
    <div className="flex h-40 items-center justify-center">
      <Spinner className="size-6" />
    </div>
  )
}

export default function SignInPage() {
  return (
    <AuthLayout
      title="Sign in"
      description="Continue to your dashboard with your account."
    >
      <Suspense fallback={<SignInFormFallback />}>
        <SignInForm />
      </Suspense>
    </AuthLayout>
  )
}
