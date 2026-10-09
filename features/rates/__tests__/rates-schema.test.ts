import { describe, expect, it } from "vitest"

import {
  createRateReferenceSchema,
  updateRateReferenceSchema,
  rateReferenceFilterSchema,
} from "@/features/rates/rates.schema"

describe("Rates Schema Validation", () => {
  describe("createRateReferenceSchema", () => {
    it("harus memvalidasi data pembuatan tarif yang sah", () => {
      const validData = {
        originPlant: "Semen Indonesia (SI) - Tuban",
        clientName: "SI",
        city: "REMBANG",
        destination: "SAFINA PL RBG",
        ratePerTon: "62795.50",
        standardTonnage: "31.00",
        sanguPercentage: "0.5200",
        defaultSangu: "1012000.00",
        additionalTonnageRate: "25000.00",
        hasSpecialDeductions: false,
        isActive: true,
      }
      const result = createRateReferenceSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.originPlant).toBe("Semen Indonesia (SI) - Tuban")
        expect(result.data.clientName).toBe("SI")
        expect(result.data.city).toBe("REMBANG")
        expect(result.data.ratePerTon).toBe("62795.50")
        expect(result.data.standardTonnage).toBe("31.00")
        expect(result.data.sanguPercentage).toBe("0.5200")
        expect(result.data.defaultSangu).toBe("1012000.00")
      }
    })

    it("harus menggunakan default value untuk standardTonnage dan additionalTonnageRate jika tidak diisi", () => {
      const minimalData = {
        clientName: "SBI",
        city: "KUDUS",
        destination: "PLTU TANJUNG JATI",
        ratePerTon: "75000",
        sanguPercentage: "0.50",
      }
      const result = createRateReferenceSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.standardTonnage).toBe("31.00")
        expect(result.data.additionalTonnageRate).toBe("25000.00")
        expect(result.data.hasSpecialDeductions).toBe(false)
        expect(result.data.isActive).toBe(true)
      }
    })

    it("harus menolak clientName kosong", () => {
      const invalidData = {
        clientName: "",
        city: "REMBANG",
        destination: "SAFINA",
        ratePerTon: "60000",
        sanguPercentage: "0.52",
      }
      const result = createRateReferenceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("harus menolak tarif per ton bernilai nol atau negatif", () => {
      const invalidData = {
        clientName: "SI",
        city: "REMBANG",
        destination: "SAFINA",
        ratePerTon: "-1000",
        sanguPercentage: "0.52",
      }
      const result = createRateReferenceSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it("harus menolak persentase sangu di luar rentang 0 sampai 1", () => {
      const invalidHigh = {
        clientName: "SI",
        city: "REMBANG",
        destination: "SAFINA",
        ratePerTon: "50000",
        sanguPercentage: "1.5",
      }
      expect(createRateReferenceSchema.safeParse(invalidHigh).success).toBe(
        false
      )

      const invalidLow = {
        clientName: "SI",
        city: "REMBANG",
        destination: "SAFINA",
        ratePerTon: "50000",
        sanguPercentage: "0",
      }
      expect(createRateReferenceSchema.safeParse(invalidLow).success).toBe(
        false
      )
    })

    it("harus memvalidasi field parameter khusus Indocement Grobogan", () => {
      const indocementData = {
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
      }
      const result = createRateReferenceSchema.safeParse(indocementData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.zoneCode).toBe("0403")
        expect(result.data.saving5Percent).toBe("10725.00")
        expect(result.data.deduction2Percent).toBe("4290.00")
        expect(result.data.ljuDeduction).toBe("132990.00")
        expect(result.data.oaDriver).toBe("199485.00")
        expect(result.data.estimatedRevenue).toBe("6184035.00")
        expect(result.data.estimatedProfitBase).toBe("2634035.00")
        expect(result.data.totalSaving).toBe("332475.00")
        expect(result.data.estimatedProfitTotal).toBe("2966510.00")
      }
    })
  })

  describe("updateRateReferenceSchema", () => {
    it("harus memvalidasi pembaruan tarif yang sah dengan UUID", () => {
      const validUpdate = {
        id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
        ratePerTon: "65000.00",
        hasSpecialDeductions: true,
      }
      const result = updateRateReferenceSchema.safeParse(validUpdate)
      expect(result.success).toBe(true)
    })

    it("harus menolak pembaruan jika id bukan format UUID", () => {
      const invalidUpdate = {
        id: "bukan-uuid",
        ratePerTon: "65000",
      }
      const result = updateRateReferenceSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })
  })

  describe("rateReferenceFilterSchema", () => {
    it("harus memvalidasi filter pencarian opsional", () => {
      const filter = {
        search: "rembang",
        clientName: "SI",
        isActive: true,
      }
      const result = rateReferenceFilterSchema.safeParse(filter)
      expect(result.success).toBe(true)
    })
  })
})
