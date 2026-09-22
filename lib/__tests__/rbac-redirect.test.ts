import { describe, expect, it } from "vitest"

import { determineRedirectPath } from "@/lib/rbac"

describe("determineRedirectPath", () => {
  describe("Pengguna belum login (Unauthenticated)", () => {
    it("harus redirect ke /login saat mengakses /dashboard", () => {
      expect(determineRedirectPath(null, "/dashboard", false)).toBe("/login")
    })

    it("harus redirect ke /login saat mengakses /profit-sharing", () => {
      expect(determineRedirectPath(null, "/profit-sharing", false)).toBe(
        "/login"
      )
    })

    it("tidak boleh redirect jika sudah di /login", () => {
      expect(determineRedirectPath(null, "/login", false)).toBeNull()
    })
  })

  describe("Pengguna terautentikasi di halaman login / root", () => {
    it("harus redirect admin dari /login ke /dashboard", () => {
      expect(determineRedirectPath("admin", "/login", true)).toBe("/dashboard")
    })

    it("harus redirect partner dari /login ke /profit-sharing", () => {
      expect(determineRedirectPath("partner", "/login", true)).toBe(
        "/profit-sharing"
      )
    })

    it("harus redirect admin dari / ke /dashboard", () => {
      expect(determineRedirectPath("admin", "/", true)).toBe("/dashboard")
    })

    it("harus redirect partner dari / ke /profit-sharing", () => {
      expect(determineRedirectPath("partner", "/", true)).toBe(
        "/profit-sharing"
      )
    })
  })

  describe("Proteksi Route Khusus Admin (Admin-Only)", () => {
    const adminRoutes = ["/dashboard", "/trips", "/expenses", "/rates"]

    adminRoutes.forEach((route) => {
      it(`harus memblokir partner dari ${route} dan redirect ke /profit-sharing`, () => {
        expect(determineRedirectPath("partner", route, true)).toBe(
          "/profit-sharing"
        )
      })

      it(`harus mengizinkan admin mengakses ${route}`, () => {
        expect(determineRedirectPath("admin", route, true)).toBeNull()
      })
    })
  })

  describe("Akses Route Bersama (Profit Sharing)", () => {
    it("harus mengizinkan partner mengakses /profit-sharing", () => {
      expect(
        determineRedirectPath("partner", "/profit-sharing", true)
      ).toBeNull()
    })

    it("harus mengizinkan admin mengakses /profit-sharing", () => {
      expect(determineRedirectPath("admin", "/profit-sharing", true)).toBeNull()
    })
  })
})
