import { describe, expect, it } from "vitest"

import { formatCurrency, formatDateIndonesian } from "@/lib/utils"

describe("Utils formatting", () => {
  describe("formatCurrency", () => {
    it("formats positive numbers in Rupiah", () => {
      const formatted = formatCurrency(1250000)
      expect(formatted).toMatch(/Rp\s?1\.250\.000/)
    })

    it("formats zero in Rupiah", () => {
      const formatted = formatCurrency(0)
      expect(formatted).toMatch(/Rp\s?0/)
    })

    it("handles invalid numbers gracefully", () => {
      expect(formatCurrency(NaN)).toBe("Rp 0")
    })
  })

  describe("formatDateIndonesian", () => {
    it("formats date strings in Indonesian long format", () => {
      const result = formatDateIndonesian("2026-09-03")
      expect(result).toMatch(/3\s+September\s+2026/)
    })

    it("formats date strings in Indonesian short format", () => {
      const result = formatDateIndonesian("2026-09-03", true)
      expect(result).toMatch(/3\s+Sep\s+2026/)
    })

    it("handles null or undefined dates gracefully", () => {
      expect(formatDateIndonesian(null)).toBe("-")
      expect(formatDateIndonesian(undefined)).toBe("-")
    })
  })
})
