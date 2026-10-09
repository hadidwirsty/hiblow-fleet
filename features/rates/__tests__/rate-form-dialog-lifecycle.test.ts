import { describe, expect, it } from "vitest"

import { resolveEditRateForLifecycle } from "../rate-form-dialog"
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
})
