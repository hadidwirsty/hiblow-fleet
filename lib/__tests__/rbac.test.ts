import { describe, expect, it } from "vitest"

import {
  assertAdmin,
  assertPartnerOrAdmin,
  isAdmin,
  isPartner,
} from "@/lib/rbac"

describe("RBAC helpers", () => {
  it("recognizes admin role correctly", () => {
    expect(isAdmin({ role: "admin" })).toBe(true)
    expect(isAdmin({ role: "partner" })).toBe(false)
    expect(isAdmin(null)).toBe(false)
    expect(isAdmin(undefined)).toBe(false)
  })

  it("recognizes partner role correctly", () => {
    expect(isPartner({ role: "partner" })).toBe(true)
    expect(isPartner({ role: "admin" })).toBe(true)
    expect(isPartner({ role: "guest" })).toBe(false)
    expect(isPartner(null)).toBe(false)
  })

  it("assertAdmin enforces admin only", () => {
    expect(() => assertAdmin({ role: "admin" })).not.toThrow()
    expect(() => assertAdmin({ role: "partner" })).toThrow(
      "FORBIDDEN_ADMIN_REQUIRED"
    )
    expect(() => assertAdmin(null)).toThrow("FORBIDDEN_ADMIN_REQUIRED")
  })

  it("assertPartnerOrAdmin enforces partner or admin", () => {
    expect(() => assertPartnerOrAdmin({ role: "partner" })).not.toThrow()
    expect(() => assertPartnerOrAdmin({ role: "admin" })).not.toThrow()
    expect(() => assertPartnerOrAdmin({ role: "viewer" })).toThrow(
      "FORBIDDEN_ACCESS_DENIED"
    )
    expect(() => assertPartnerOrAdmin(null)).toThrow("FORBIDDEN_ACCESS_DENIED")
  })
})
