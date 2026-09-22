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
})
