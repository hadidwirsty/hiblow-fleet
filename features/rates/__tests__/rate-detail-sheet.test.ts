import { describe, expect, it } from "vitest"

import {
  getRateDetailSheetAnimationClasses,
  resolveActiveRateDetail,
  resolveAdditionalTonnageCalculation,
} from "../rate-detail-sheet"
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

describe("RateDetailSheet Animation & Lifecycle Logic", () => {
  it("harus menyertakan kelas animasi slide-in penuh dari kanan dengan durasi 300ms", () => {
    const classes = getRateDetailSheetAnimationClasses()
    expect(classes).toContain("data-starting-style:translate-x-full")
    expect(classes).toContain("data-ending-style:translate-x-full")
    expect(classes).toContain("duration-300")
    expect(classes).toContain("transition-all")
  })

  it("harus menyelesaikan active rate dengan cachedRate jika rate null saat proses penutupan", () => {
    // Skenario 1: rate ada saat buka
    const initial = resolveActiveRateDetail(mockRate, null)
    expect(initial).toEqual(mockRate)

    // Skenario 2: rate menjadi null saat transisi penutupan, harus menggunakan cachedRate
    const duringClose = resolveActiveRateDetail(null, mockRate)
    expect(duringClose).toEqual(mockRate)

    // Skenario 3: tidak ada rate maupun cache
    const empty = resolveActiveRateDetail(null, null)
    expect(empty).toBeNull()
  })

  it("harus dapat menyelesaikan detail rute Indocement Grobogan beserta parameter khususnya", () => {
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
    const resolved = resolveActiveRateDetail(indocementRate, null)
    expect(resolved?.originPlant).toBe("Indocement - Grobogan")
    expect(resolved?.zoneCode).toBe("0403")
    expect(resolved?.cityCode).toBe("040304")
    expect(resolved?.saving5Percent).toBe("10725.00")
    expect(resolved?.estimatedProfitTotal).toBe("2966510.00")
  })

  it("harus dapat menyelesaikan informasi jarak tempuh distanceKm jika tersedia", () => {
    const resolved = resolveActiveRateDetail(mockRate, null)
    expect(resolved?.distanceKm).toBe("120")
  })

  it("harus dapat mendeteksi perhitungan tarif lebih tonase berbasis persentase (misal 30% pada Blora)", () => {
    // Skenario 1: 30% dari 47.869 = 14.361
    const calc = resolveAdditionalTonnageCalculation(47869, 14361)
    expect(calc.isPercentage).toBe(true)
    expect(calc.percentage).toBe(30)

    // Skenario 2: Nominal tetap / tidak cocok persentase bulat (25.000 dari 214.500)
    const fixedCalc = resolveAdditionalTonnageCalculation(214500, 25000)
    expect(fixedCalc.isPercentage).toBe(false)
    expect(fixedCalc.percentage).toBe(0)
  })
})
