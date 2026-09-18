import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { getSessionCookie } from "better-auth/cookies"

import { determineRedirectPath } from "@/lib/rbac"

interface SessionResponse {
  user?: {
    id: string
    email: string
    name: string
    role?: string
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionCookie = getSessionCookie(request)

  // 1. Cepat: Jika tidak ada cookie sesi sama sekali
  if (!sessionCookie) {
    const redirectPath = determineRedirectPath(null, pathname, false)
    if (redirectPath) {
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
    return NextResponse.next()
  }

  // 2. Ada cookie sesi: Verifikasi sesi dan ambil role pengguna
  try {
    const sessionRes = await fetch(
      new URL("/api/auth/get-session", request.url),
      {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
        cache: "no-store",
      }
    )

    const sessionData = (await sessionRes.json()) as SessionResponse | null
    const isAuthenticated = !!sessionData?.user
    const role = sessionData?.user?.role ?? null

    const redirectPath = determineRedirectPath(role, pathname, isAuthenticated)
    if (redirectPath) {
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  } catch (error) {
    console.error("Middleware auth check failed:", error)
    // Fallback defensively: jika verifikasi gagal di route non-login, arahkan ke login
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Kecualikan file statis, gambar publik, next internal, dan endpoint api/auth
     */
    "/((?!_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|api/auth).*)",
  ],
}
