import { Suspense } from "react"
import { AuthLayout } from "@/components/auth/auth-layout"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { Spinner } from "@/components/ui/spinner"

export const metadata = {
  title: "Sign Up | AI Job Agent",
  description: "Create your AI Job Agent account",
}

function SignUpFormFallback() {
  return (
    <div className="flex h-40 items-center justify-center">
      <Spinner className="size-6" />
    </div>
  )
}

export default function SignUpPage() {
  return (
    <AuthLayout
      title="Create an account"
      description="Get started with AI-powered job applications."
    >
      <Suspense fallback={<SignUpFormFallback />}>
        <SignUpForm />
      </Suspense>
    </AuthLayout>
  )
}
