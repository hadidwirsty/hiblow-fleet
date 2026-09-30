import { describe, expect, it } from "vitest"

import {
  formatCurrency,
  formatCurrencyInput,
  formatDateIndonesian,
  formatPercentage,
  parseCurrencyInput,
} from "@/lib/utils"

describe("Utils formatting", () => {
  describe("formatCurrency", () => {
    it("formats positive numbers in Rupiah without space", () => {
      const formatted = formatCurrency(1250000)
      expect(formatted).toBe("Rp1.250.000")
    })

    it("formats zero in Rupiah without space", () => {
      const formatted = formatCurrency(0)
      expect(formatted).toBe("Rp0")
    })

    it("formats integer numbers without decimal fraction in Rupiah", () => {
      const formatted = formatCurrency(1946661)
      expect(formatted).toBe("Rp1.946.661")
    })

    it("formats decimal numbers with fraction in Rupiah", () => {
      const formatted = formatCurrency(62795.5)
      expect(formatted).toBe("Rp62.795,50")
    })

    it("handles invalid numbers gracefully", () => {
      expect(formatCurrency(NaN)).toBe("Rp0")
    })
  })

  describe("parseCurrencyInput & formatCurrencyInput", () => {
    it("handles comma decimal input correctly", () => {
      expect(parseCurrencyInput("62.795,5")).toBe("62795.5")
      expect(parseCurrencyInput("62.795,")).toBe("62795.")
      expect(parseCurrencyInput("1.946.661")).toBe("1946661")
      expect(formatCurrencyInput("62795.5")).toBe("62.795,5")
      expect(formatCurrencyInput("62795.")).toBe("62.795,")
      expect(formatCurrencyInput("1946661")).toBe("1.946.661")
      expect(formatCurrencyInput("1946661.00")).toBe("1.946.661")
    })
  })

  describe("formatPercentage", () => {
    it("formats integer percentages correctly", () => {
      expect(formatPercentage(0.52)).toBe("52%")
      expect(formatPercentage("0.52")).toBe("52%")
      expect(formatPercentage(52)).toBe("52%")
      expect(formatPercentage("52%")).toBe("52%")
      expect(formatPercentage("0.5000")).toBe("50%")
    })

    it("formats 5 decimal places accurately with Indonesian comma separator", () => {
      expect(formatPercentage(0.5258552)).toBe("52,58552%")
      expect(formatPercentage("0.5258552")).toBe("52,58552%")
      expect(formatPercentage("0.4780845")).toBe("47,80845%")
      expect(formatPercentage("52,58552")).toBe("52,58552%")
      expect(formatPercentage("52.58552%")).toBe("52,58552%")
    })

    it("handles edge cases gracefully", () => {
      expect(formatPercentage(0)).toBe("0%")
      expect(formatPercentage(null)).toBe("0%")
      expect(formatPercentage(undefined)).toBe("0%")
      expect(formatPercentage("")).toBe("0%")
      expect(formatPercentage("invalid")).toBe("0%")
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
