import { headers } from "next/headers"

import { auth } from "@/src/lib/auth"

/**
 * Retrieves the current session from incoming request headers.
 */
export async function getCurrentSession() {
  const reqHeaders = await headers()
  return await auth.api.getSession({
    headers: reqHeaders,
  })
}

/**
 * Requires an active session. Throws UNAUTHORIZED if not logged in.
 */
export async function requireSession() {
  const session = await getCurrentSession()
  if (!session || !session.user) {
    throw new Error("UNAUTHORIZED")
  }
  return session
}
