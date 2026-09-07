export type UserRole = "admin" | "partner"

export interface UserWithRole {
  role?: string | null
}

/**
 * Checks if user has admin privileges (Mas Hafidz).
 */
export function isAdmin(user: UserWithRole | null | undefined): boolean {
  return user?.role === "admin"
}

/**
 * Checks if user has at least partner privileges (Investor or Admin).
 */
export function isPartner(user: UserWithRole | null | undefined): boolean {
  return user?.role === "partner" || user?.role === "admin"
}

/**
 * Throws an error if user is not an admin.
 * Follows Deny-By-Default security principle.
 */
export function assertAdmin(user: UserWithRole | null | undefined): void {
  if (!isAdmin(user)) {
    throw new Error("FORBIDDEN_ADMIN_REQUIRED")
  }
}

/**
 * Throws an error if user is neither partner nor admin.
 * Follows Deny-By-Default security principle.
 */
export function assertPartnerOrAdmin(
  user: UserWithRole | null | undefined
): void {
  if (!isPartner(user)) {
    throw new Error("FORBIDDEN_ACCESS_DENIED")
  }
}
