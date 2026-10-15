import { describe, expect, it } from "vitest"

import { calculateTaxAccounting } from "@/domain/calculators/tax-accounting"
import { formatTaxAccountingForExcel } from "@/features/taxes/taxes.export"
import type { TaxAccountingData } from "@/features/taxes/taxes.queries"

describe("formatTaxAccountingForExcel", () => {
  const sampleCalculations = calculateTaxAccounting({
    grossOmset: 100000000,
    driverSangu: 40000000,
    driverIncentive: 3500000,
    thirdPartyFee: 1500000,
    factoryDeductions: 2000000,
    truckOpex: 15500000,
    tax1PctWithholding: 1000000,
  })

  const sampleData: TaxAccountingData = {
    period: {
      year: 2026,
      month: 10,
      periodLabel: "Oktober 2026",
    },
    tripMetrics: {
      totalTrips: 15,
      totalTonnage: 450,
      grossOmset: 100000000,
      totalSangu: 40000000,
      totalIncentive: 3500000,
      totalThirdPartyFee: 1500000,
      totalDeduction2PctLju: 1000000,
      totalTax1PctWithholding: 1000000,
    },
    expenseMetrics: {
      totalOpex: 15500000,
      categoryBreakdown: [
        { category: "Servis & Perbaikan", total: 10000000, count: 2 },
        { category: "Onderdil / Ban", total: 4000000, count: 1 },
        { category: "Administrasi & Tol", total: 1500000, count: 1 },
      ],
    },
    calculations: sampleCalculations,
    withholdingTripDetails: [
      {
        id: "trip-1",
        letterNumber: "SJ-1001",
        unloadingDate: "2026-10-05",
        factoryName: "SI Tuban",
        omset: 20000000,
        tax1Pct: 200000,
        taxWithholdingNumber: "BP-SI-2026-1001",
        taxWithholdingDate: "2026-10-06",
      },
    ],
  }

  it("builds 3 valid excel sheets with headers and data rows including bupot details", () => {
    const sheets = formatTaxAccountingForExcel(sampleData)

    expect(sheets).toHaveLength(3)

    // Sheet 1: Komparasi Pajak
    expect(sheets[0].sheetName).toBe("Komparasi Pajak")
    expect(sheets[0].headers).toContain("Skema Perhitungan Pajak")
    expect(sheets[0].rows.length).toBeGreaterThanOrEqual(3)

    // Sheet 2: Pembukuan Fiskal
    expect(sheets[1].sheetName).toBe("Pembukuan Fiskal Usaha")
    expect(sheets[1].headers).toContain("Pos Keuangan")
    expect(sheets[1].rows.length).toBeGreaterThanOrEqual(10)

    // Sheet 3: Rekap Bukti Potong PPh 1%
    expect(sheets[2].sheetName).toBe("Rekap Bukti Potong PPh 1%")
    expect(sheets[2].headers).toContain("Parameter / No. SJ")
    // Memeriksa baris rincian ritase nomor bupot ada di Sheet 3
    const flatRows = sheets[2].rows.map((r) => r.join(" "))
    expect(flatRows.some((row) => row.includes("BP-SI-2026-1001"))).toBe(true)
    expect(flatRows.some((row) => row.includes("SJ-1001"))).toBe(true)
  })
})
