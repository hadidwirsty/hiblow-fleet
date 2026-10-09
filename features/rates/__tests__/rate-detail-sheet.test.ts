import { describe, expect, it } from "vitest"

import {
  getRateDetailSheetAnimationClasses,
  resolveActiveRateDetail,
} from "../rate-detail-sheet"
import type { RateReference } from "@/db/schema"

const mockRate: RateReference = {
  id: "rate-1",
  originPlant: "Semen Indonesia (SI) - Tuban",
  clientName: "PT Semen Indonesia",
  city: "SURABAYA",
  cityCode: "SBY01",
  destination: "PROYEK RSUD BDH",
  distanceKm: "120",
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
})
