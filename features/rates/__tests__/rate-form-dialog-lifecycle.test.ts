import { describe, expect, it } from "vitest"

import { resolveEditRateForLifecycle } from "../rate-form-dialog"
import type { RateReference } from "@/db/schema"

const mockRate: RateReference = {
  id: "rate-1",
  originPlant: "Semen Indonesia (SI) - Tuban",
  clientName: "PT Semen Indonesia",
  city: "SURABAYA",
  cityCode: "SBY01",
  zoneCode: null,
  destination: "PROYEK RSUD BDH",
  distanceKm: "120",
  saving5Percent: null,
  deduction2Percent: null,
  ljuDeduction: null,
  oaDriver: null,
  estimatedRevenue: null,
  estimatedProfitBase: null,
  totalSaving: null,
  estimatedProfitTotal: null,
  ratePerTon: "100000.00",
  standardTonnage: "31.00",
  sanguPercentage: "0.5200000",
  defaultSangu: "1620000.00",
  additionalTonnageRate: "30000.00",
  hasSpecialDeductions: false,
  isActive: true,
  createdAt: new Date(),
}

describe("RateFormDialog Lifecycle & Cache Logic", () => {
  it("harus mengembalikan null saat dalam mode standby (rate null dan cache null)", () => {
    const active = resolveEditRateForLifecycle(null, null)
    expect(active).toBeNull()
  })

  it("harus menggunakan rate aktif saat modal dibuka dengan data rute", () => {
    const active = resolveEditRateForLifecycle(mockRate, null)
    expect(active).toEqual(mockRate)
  })

  it("harus mempertahankan data rute dari cache saat rate di-clear saat animasi keluar", () => {
    const active = resolveEditRateForLifecycle(null, mockRate)
    expect(active).toEqual(mockRate)
  })

  it("harus mempertahankan seluruh field spesifik Indocement Grobogan pada data rute aktif", () => {
    const indocementRate: RateReference = {
      id: "rate-indo-1",
      originPlant: "Indocement - Grobogan",
      clientName: "Indocement",
      city: "MALANG",
      cityCode: "040304",
      zoneCode: "0403",
      destination: "Wagir",
      distanceKm: null,
      saving5Percent: "10725.00",
      deduction2Percent: "4290.00",
      ljuDeduction: "132990.00",
      oaDriver: "199485.00",
      estimatedRevenue: "6184035.00",
      estimatedProfitBase: "2634035.00",
      totalSaving: "332475.00",
      estimatedProfitTotal: "2966510.00",
      ratePerTon: "214500.00",
      standardTonnage: "31.00",
      sanguPercentage: "0.5740588",
      defaultSangu: "3550000.00",
      additionalTonnageRate: "25000.00",
      hasSpecialDeductions: true,
      isActive: true,
      createdAt: new Date(),
    }
    const active = resolveEditRateForLifecycle(indocementRate, null)
    expect(active?.zoneCode).toBe("0403")
    expect(active?.cityCode).toBe("040304")
    expect(active?.saving5Percent).toBe("10725.00")
    expect(active?.oaDriver).toBe("199485.00")
    expect(active?.estimatedProfitTotal).toBe("2966510.00")
  })
})
