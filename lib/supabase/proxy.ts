import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

const AUTH_ROUTES = ["/sign-in", "/sign-up"]

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          )
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()
  const user = data?.claims
  const { pathname } = request.nextUrl

  if (!user && pathname.startsWith("/dashboard")) {
    const url = request.nextUrl.clone()
    url.pathname = "/sign-in"
    url.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard/jobs"
    url.search = ""
    return NextResponse.redirect(url)
  }

  if (user && pathname === "/dashboard") {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard/jobs"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
