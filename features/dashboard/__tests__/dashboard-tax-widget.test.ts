import { describe, expect, it } from "vitest"

import { calculateTaxAccounting } from "@/domain/calculators/tax-accounting"
import { formatDashboardTaxWidgetData } from "@/features/dashboard/dashboard-tax-widget"

describe("formatDashboardTaxWidgetData", () => {
  const sampleCalculations = calculateTaxAccounting({
    grossOmset: 100000000,
    driverSangu: 40000000,
    driverIncentive: 3500000,
    thirdPartyFee: 1500000,
    factoryDeductions: 2000000,
    truckOpex: 15500000,
    tax1PctWithholding: 1000000,
  })

  it("extracts and formats annual tax highlight data accurately", () => {
    const data = formatDashboardTaxWidgetData(sampleCalculations, 2026)

    expect(data.yearLabel).toBe("Tahun 2026")
    expect(data.grossOmsetFormatted).toBe("Rp100.000.000")
    expect(data.bestSchemeName).toContain("UMKM 0.5%")
    expect(data.estimatedCashTaxFormatted).toBe("Rp500.000")
    expect(data.cashSavingsFormatted).toBe("Rp1.690.000")
    expect(data.href).toBe("/taxes?year=2026")
  })
})
