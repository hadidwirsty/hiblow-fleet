import { describe, expect, it, vi } from "vitest"

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import {
  createRateReference,
  updateRateReference,
  toggleRateReferenceStatus,
  deleteRateReference,
} from "@/features/rates/rates.actions"

describe("Rates Server Actions Validation Guard", () => {
  it("harus menolak createRateReference jika input tidak valid", async () => {
    // @ts-expect-error deliberately invalid payload
    const res = await createRateReference({})
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toBeDefined()
    }
  })

  it("harus menolak updateRateReference jika id bukan UUID", async () => {
    const res = await updateRateReference({
      id: "bukan-uuid",
      ratePerTon: "50000",
    })
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toBeDefined()
    }
  })

  it("harus menolak toggleRateReferenceStatus jika id bukan UUID", async () => {
    const res = await toggleRateReferenceStatus("invalid-id", false)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toBeDefined()
    }
  })

  it("harus menolak deleteRateReference jika id bukan UUID", async () => {
    const res = await deleteRateReference("invalid-id")
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error).toBeDefined()
    }
  })

  it("harus berhasil createRateReference dengan originPlant dan defaultSangu", async () => {
    const res = await createRateReference({
      originPlant: "Semen Indonesia (SI) - Tuban",
      clientName: "SI",
      city: "KUDUS",
      destination: "BATCHING PLANT KUDUS JAYA",
      ratePerTon: "70000.00",
      standardTonnage: "31.00",
      sanguPercentage: "0.5200",
      defaultSangu: "1128000.00",
      additionalTonnageRate: "25000.00",
      hasSpecialDeductions: false,
      isActive: true,
    })
    expect(res.success).toBe(true)
    if (res.success && res.rate) {
      expect(res.rate.originPlant).toBe("Semen Indonesia (SI) - Tuban")
      expect(res.rate.defaultSangu).toBe("1128000.00")
      await deleteRateReference(res.rate.id)
    }
  })

  it("harus berhasil createRateReference dan updateRateReference dengan field khusus Indocement", async () => {
    const res = await createRateReference({
      originPlant: "Indocement - Grobogan",
      clientName: "Indocement",
      city: "MALANG",
      cityCode: "040304",
      zoneCode: "0403",
      destination: "Wagir",
      ratePerTon: "214500.00",
      standardTonnage: "31.00",
      sanguPercentage: "0.57405",
      defaultSangu: "3550000.00",
      saving5Percent: "10725.00",
      deduction2Percent: "4290.00",
      ljuDeduction: "132990.00",
      oaDriver: "199485.00",
      estimatedRevenue: "6184035.00",
      estimatedProfitBase: "2634035.00",
      totalSaving: "332475.00",
      estimatedProfitTotal: "2966510.00",
      hasSpecialDeductions: true,
      isActive: true,
    })
    expect(res.success).toBe(true)
    if (res.success && res.rate) {
      expect(res.rate.zoneCode).toBe("0403")
      expect(res.rate.saving5Percent).toBe("10725.00")
      expect(res.rate.deduction2Percent).toBe("4290.00")
      expect(res.rate.ljuDeduction).toBe("132990.00")
      expect(res.rate.oaDriver).toBe("199485.00")
      expect(res.rate.estimatedRevenue).toBe("6184035.00")
      expect(res.rate.estimatedProfitBase).toBe("2634035.00")
      expect(res.rate.totalSaving).toBe("332475.00")
      expect(res.rate.estimatedProfitTotal).toBe("2966510.00")

      const updateRes = await updateRateReference({
        id: res.rate.id,
        saving5Percent: "11000.00",
      })
      expect(updateRes.success).toBe(true)
      if (updateRes.success && updateRes.rate) {
        expect(updateRes.rate.saving5Percent).toBe("11000.00")
      }

      await deleteRateReference(res.rate.id)
    }
  })

  it("harus otomatis menetapkan hasSpecialDeductions: true untuk pabrik Indocement Grobogan meskipun dioper false", async () => {
    const res = await createRateReference({
      originPlant: "Indocement - Grobogan",
      clientName: "Indocement",
      city: "SEMARANG",
      destination: "PT ADHI KARYA",
      ratePerTon: "100000.00",
      standardTonnage: "31.00",
      sanguPercentage: "0.5000",
      defaultSangu: "1550000.00",
      additionalTonnageRate: "25000.00",
      hasSpecialDeductions: false,
      isActive: true,
    })
    expect(res.success).toBe(true)
    if (res.success && res.rate) {
      expect(res.rate.hasSpecialDeductions).toBe(true)
      await deleteRateReference(res.rate.id)
    }
  })
})
