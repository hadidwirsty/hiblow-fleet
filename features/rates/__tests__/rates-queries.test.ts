import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { rateReferences } from "@/db/schema"
import {
  listRateReferences,
  getRateReferencesSummary,
  getDistinctClients,
  getDistinctOriginPlants,
} from "@/features/rates/rates.queries"

describe("Rates Queries Integration", () => {
  const testIds: string[] = []

  beforeAll(async () => {
    // Pastikan ada data uji mandiri
    const existing = await db.select().from(rateReferences).limit(1)
    if (existing.length === 0) {
      const inserted = await db
        .insert(rateReferences)
        .values([
          {
            originPlant: "Semen Indonesia (SI) - Tuban",
            clientName: "SI",
            city: "REMBANG",
            destination: "BATCHING PLANT REMBANG",
            ratePerTon: "95000.00",
            standardTonnage: "31.00",
            sanguPercentage: "0.5200",
            defaultSangu: "1531000.00",
            additionalTonnageRate: "25000.00",
            hasSpecialDeductions: false,
            isActive: true,
          },
          {
            originPlant: "Indocement - Grobogan",
            clientName: "Indocement Grobogan",
            city: "SEMARANG",
            destination: "PROYEK TOL SEMARANG",
            ratePerTon: "110000.00",
            standardTonnage: "31.00",
            sanguPercentage: "0.5000",
            defaultSangu: "1705000.00",
            additionalTonnageRate: "25000.00",
            hasSpecialDeductions: true,
            isActive: true,
          },
        ])
        .returning({ id: rateReferences.id })
      testIds.push(...inserted.map((i) => i.id))
    }
  })

  afterAll(async () => {
    if (testIds.length > 0) {
      for (const id of testIds) {
        await db.delete(rateReferences).where(eq(rateReferences.id, id))
      }
    }
  })

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

  it("harus mengembalikan daftar pabrik asal unik terurut", async () => {
    const plants = await getDistinctOriginPlants()
    expect(Array.isArray(plants)).toBe(true)
    expect(plants.length).toBeGreaterThan(0)
    expect(plants).toContain("Semen Indonesia (SI) - Tuban")
    expect(plants).toContain("Indocement - Grobogan")
  })

  it("harus dapat memfilter berdasarkan pabrik asal (originPlant)", async () => {
    const results = await listRateReferences({
      originPlant: "Semen Indonesia (SI) - Tuban",
    })
    expect(Array.isArray(results)).toBe(true)
    expect(results.length).toBeGreaterThan(0)
    results.forEach((r) => {
      expect(r.originPlant).toBe("Semen Indonesia (SI) - Tuban")
    })
  })
})
