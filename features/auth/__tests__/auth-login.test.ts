import { describe, expect, it } from "vitest"
import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

describe("loginSchema validation", () => {
  it("harus gagal untuk email tidak valid", () => {
    const result = loginSchema.safeParse({
      email: "bukan-email",
      password: "password123",
    })
    expect(result.success).toBe(false)
  })

  it("harus gagal untuk password kurang dari 6 karakter", () => {
    const result = loginSchema.safeParse({
      email: "test@test.com",
      password: "12345",
    })
    expect(result.success).toBe(false)
  })

  it("harus berhasil untuk input valid", () => {
    const result = loginSchema.safeParse({
      email: "hafidz@hiblow.fleet",
      password: "password123",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("hafidz@hiblow.fleet")
      expect(result.data.password).toBe("password123")
    }
  })
})
