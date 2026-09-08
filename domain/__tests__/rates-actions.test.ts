import { describe, expect, it } from "vitest"

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
})
