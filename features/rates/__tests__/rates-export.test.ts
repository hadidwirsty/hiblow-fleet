import { describe, expect, it } from "vitest"

import type { RateReference } from "@/db/schema"
import {
  formatRatesForExport,
  getRatesExportFilename,
} from "@/features/rates/rates.export"

describe("rates.export", () => {
  const mockRates: RateReference[] = [
    {
      id: "rate-1",
      originPlant: "Semen Indonesia (SI) - Tuban",
      clientName: "Semen Indonesia - Tuban",
      city: "SEMARANG",
      cityCode: null,
      zoneCode: null,
      destination: "PROYEK TOL SEMARANG",
      distanceKm: null,
      saving5Percent: null,
      deduction2Percent: null,
      ljuDeduction: null,
      oaDriver: null,
      estimatedRevenue: null,
      estimatedProfitBase: null,
      totalSaving: null,
      estimatedProfitTotal: null,
      ratePerTon: "110000.00",
      standardTonnage: "31.00",
      sanguPercentage: "0.5000000",
      defaultSangu: null,
      additionalTonnageRate: "33000.00",
      hasSpecialDeductions: true,
      isActive: true,
      createdAt: new Date(),
    },
  ]

  it("should format rate records into clean tabular headers and rows", () => {
    const data = formatRatesForExport(mockRates)

    expect(data.sheetName).toBe("Referensi Tarif Pabrik")
    expect(data.headers).toContain("Pabrik Asal")
    expect(data.headers).toContain("Kota Tujuan")
    expect(data.headers).toContain("Tujuan Bongkar (Proyek / BP)")
    expect(data.headers).toContain("Jarak (Km)")
    expect(data.headers).toContain("Tarif OA / Ton (Rp)")
    expect(data.headers).toContain("Persentase Sangu (%)")
    expect(data.headers).toContain("Sangu Supir (Rp)")
    expect(data.headers).toContain("Estimasi Profit (Rp)")
    expect(data.headers).toContain("Pendapatan / Km (Rp)")
    expect(data.headers).toContain("Estimasi Profit / Km (Rp)")

    expect(data.rows).toHaveLength(1)
    const row = data.rows[0]
    expect(row[0]).toBe(1) // No
    expect(row[1]).toBe("Semen Indonesia (SI) - Tuban")
    expect(row[2]).toBe("SEMARANG")
    expect(row[3]).toBe("PROYEK TOL SEMARANG")
    expect(row[4]).toBe("-") // Jarak (null)
    expect(row[5]).toBe(110000) // Tarif OA
    expect(row[6]).toBe(31) // Tonase
    expect(row[7]).toBe(3410000) // 110.000 * 31
    expect(row[8]).toBe("50%") // % Sangu
    expect(row[9]).toBe(1705000) // Sangu Supir
    expect(row[10]).toBe(33000) // Tarif Lebih Tonase
    expect(row[11]).toBe(1705000) // Estimasi Profit
    expect(row[12]).toBe("-") // Pendapatan / Km (null jika jarak null)
    expect(row[13]).toBe("-") // Profit / Km (null jika jarak null)
    expect(row[14]).toBe("LJU (1%, 2%, 5%)")
    expect(row[15]).toBe("Aktif")
  })

  it("should format distance and unit metrics when distanceKm is present", () => {
    const rateWithDistance: RateReference = {
      ...mockRates[0],
      id: "rate-2",
      distanceKm: "200.00",
    }
    const data = formatRatesForExport([rateWithDistance])
    const row = data.rows[0]

    expect(row[4]).toBe(200) // Jarak (Km)
    expect(row[12]).toBe(17050) // Pendapatan / Km: 3.410.000 / 200
    expect(row[13]).toBe(8525) // Profit / Km: 1.705.000 / 200
  })

  it("should generate proper export filename with current date", () => {
    const filenameXlsx = getRatesExportFilename("xlsx")
    const filenameCsv = getRatesExportFilename("csv")

    expect(filenameXlsx).toMatch(
      /^referensi-tarif-pabrik-\d{4}-\d{2}-\d{2}\.xlsx$/
    )
    expect(filenameCsv).toMatch(
      /^referensi-tarif-pabrik-\d{4}-\d{2}-\d{2}\.csv$/
    )
  })
})
