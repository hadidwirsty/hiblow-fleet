import { describe, expect, it } from "vitest"

import {
  createPeriodSchema,
  DEFAULT_FLEET_VALUATION,
  DEFAULT_MANAGER_COMMISSION_RATE,
  DEFAULT_PARTNERS,
  partnerInputSchema,
  previewPeriodSchema,
} from "@/features/profit-sharing/profit-sharing.schema"

describe("profit-sharing.schema", () => {
  describe("partnerInputSchema", () => {
    it("validates valid partner data", () => {
      const valid = {
        name: "Alfiah",
        capitalShare: 50000000,
        partnerUserId: "user-123",
      }
      const result = partnerInputSchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Alfiah")
        expect(result.data.capitalShare).toBe(50000000)
      }
    })

    it("rejects non-positive capitalShare", () => {
      const invalid = {
        name: "Hadid",
        capitalShare: 0,
      }
      const result = partnerInputSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("lebih dari 0")
      }
    })

    it("rejects empty name", () => {
      const invalid = {
        name: "",
        capitalShare: 10000000,
      }
      const result = partnerInputSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe("createPeriodSchema", () => {
    it("validates complete happy path with defaults", () => {
      const valid = {
        title: "Bagi Hasil September 2025",
        startDate: "2025-09-01",
        endDate: "2025-09-30",
        partners: [...DEFAULT_PARTNERS],
      }
      const result = createPeriodSchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.managerCommissionRate).toBe(
          DEFAULT_MANAGER_COMMISSION_RATE
        )
        expect(result.data.fleetValuation).toBe(DEFAULT_FLEET_VALUATION)
        expect(result.data.partners).toHaveLength(3)
      }
    })

    it("rejects when startDate is greater than endDate", () => {
      const invalid = {
        title: "Invalid Dates",
        startDate: "2025-09-30",
        endDate: "2025-09-01",
        partners: [{ name: "Partner A", capitalShare: 10000000 }],
      }
      const result = createPeriodSchema.safeParse(invalid)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Tanggal mulai tidak boleh melebihi tanggal selesai"
        )
      }
    })

    it("rejects empty partners array", () => {
      const invalid = {
        title: "No Partners",
        startDate: "2025-09-01",
        endDate: "2025-09-30",
        partners: [],
      }
      const result = createPeriodSchema.safeParse(invalid)
      expect(result.success).toBe(false)
    })
  })

  describe("previewPeriodSchema", () => {
    it("provides default partners if not passed", () => {
      const valid = {
        startDate: "2025-09-01",
        endDate: "2025-09-30",
      }
      const result = previewPeriodSchema.safeParse(valid)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.partners).toHaveLength(3)
      }
    })
  })
})
