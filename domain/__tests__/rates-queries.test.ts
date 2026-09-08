import { describe, expect, it } from "vitest"

import {
  listRateReferences,
  getRateReferencesSummary,
  getDistinctClients,
} from "@/features/rates/rates.queries"

describe("Rates Queries Integration", () => {
  it("harus mengembalikan array daftar tarif", async () => {
    const rates = await listRateReferences({ limit: 10 })
    expect(Array.isArray(rates)).toBe(true)
    expect(rates.length).toBeGreaterThan(0)
    if (rates.length > 0) {
      expect(rates[0]).toHaveProperty("id")
      expect(rates[0]).toHaveProperty("clientName")
      expect(rates[0]).toHaveProperty("city")
      expect(rates[0]).toHaveProperty("destination")
      expect(rates[0]).toHaveProperty("ratePerTon")
      expect(rates[0]).toHaveProperty("sanguPercentage")
    }
  })

  it("harus dapat memfilter berdasarkan pencarian kota", async () => {
    const results = await listRateReferences({ search: "REMBANG" })
    expect(Array.isArray(results)).toBe(true)
    results.forEach((r) => {
      const match =
        r.city.toUpperCase().includes("REMBANG") ||
        r.destination.toUpperCase().includes("REMBANG") ||
        r.clientName.toUpperCase().includes("REMBANG")
      expect(match).toBe(true)
    })
  })

  it("harus dapat memfilter berdasarkan klien", async () => {
    const results = await listRateReferences({ clientName: "SI" })
    expect(Array.isArray(results)).toBe(true)
    results.forEach((r) => {
      expect(r.clientName).toBe("SI")
    })
  })

  it("harus mengembalikan summary agregasi tarif yang valid", async () => {
    const summary = await getRateReferencesSummary()
    expect(typeof summary.totalRoutes).toBe("number")
    expect(typeof summary.activeRoutes).toBe("number")
    expect(typeof summary.uniqueClients).toBe("number")
    expect(typeof summary.avgRatePerTon).toBe("number")
    expect(typeof summary.specialDeductionRoutes).toBe("number")
    expect(summary.totalRoutes).toBeGreaterThan(0)
    expect(summary.uniqueClients).toBeGreaterThan(0)
  })

  it("harus mengembalikan daftar klien pabrik unik terurut", async () => {
    const clients = await getDistinctClients()
    expect(Array.isArray(clients)).toBe(true)
    expect(clients.length).toBeGreaterThan(0)
    expect(clients).toContain("SI")
  })
})
