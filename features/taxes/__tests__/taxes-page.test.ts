import { describe, expect, it } from "vitest"

import { parseTaxSearchParams } from "@/features/taxes/taxes.filter"

describe("parseTaxSearchParams", () => {
  it("parses valid year, month, and truckId accurately", () => {
    const params = {
      year: "2026",
      month: "10",
      truckId: "W8187UA",
    }

    const parsed = parseTaxSearchParams(params)
    expect(parsed.year).toBe(2026)
    expect(parsed.month).toBe(10)
    expect(parsed.truckId).toBe("W8187UA")
  })

  it("falls back to current year when year is missing or invalid", () => {
    const parsed = parseTaxSearchParams({})
    expect(parsed.year).toBe(new Date().getFullYear())
    expect(parsed.month).toBeUndefined()
    expect(parsed.truckId).toBeUndefined()
  })

  it("handles 'ALL' for month and truckId as undefined", () => {
    const parsed = parseTaxSearchParams({
      year: "2025",
      month: "ALL",
      truckId: "ALL",
    })
    expect(parsed.year).toBe(2025)
    expect(parsed.month).toBeUndefined()
    expect(parsed.truckId).toBeUndefined()
  })
})
