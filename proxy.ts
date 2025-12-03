import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export default async function proxy(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname === "/"

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export { proxy }

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
