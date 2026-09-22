import { describe, expect, it } from "vitest"

import type { Trip } from "@/db/schema"
import {
  formatTripsForExport,
  getTripsExportFilename,
} from "@/features/trips/trips.export"

describe("trips.export", () => {
  const mockTrips: Trip[] = [
    {
      id: "trip-uuid-1",
      truckId: "W8187UA",
      orderNumber: 105,
      orderDate: "2025-09-01",
      unloadingDate: "2025-09-02",
      rateReferenceId: null,
      destinationCity: "REMBANG",
      destinationName: "ARIES PUTRA BETON",
      ratePerTon: "95000.00",
      loadedTonnage: "31.50",
      unloadedTonnage: "31.20",
      omset: "2964000.00",
      sangu: "1532000.00",
      incentiveRate: "35000.00",
      incentivePaid: "35000.00",
      incentiveStatus: "Lunas",
      thirdPartyFee: "50000.00",
      thirdPartyName: "Mas Mawan",
      thirdPartyStatus: "Lunas",
      tax1Pct: "0.00",
      deduction2PctLju: "0.00",
      deduction5PctUjGrb: "0.00",
      mealAllowance: "0.00",
      savings: "0.00",
      claim: "0.00",
      claimDriver: "0.00",
      profit: "1347000.00",
      notes: "Aman lancar",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  it("should format trip records into clean tabular headers and rows", () => {
    const data = formatTripsForExport(mockTrips)

    expect(data.sheetName).toBe("Rekap Ritase")
    expect(data.headers).toContain("No. Surat Jalan")
    expect(data.headers).toContain("Armada")
    expect(data.headers).toContain("Kota Tujuan")
    expect(data.headers).toContain("Omset Bruto (Rp)")
    expect(data.headers).toContain("Sangu Supir (Rp)")
    expect(data.headers).toContain("Laba Bersih (Rp)")

    expect(data.rows).toHaveLength(1)
    const row = data.rows[0]
    expect(row[0]).toBe(105) // No order
    expect(row[1]).toBe("W 8187 UA") // Formatted plate
    expect(row[2]).toBe("2025-09-01") // Order date
    expect(row[3]).toBe("2025-09-02") // Unloading date
    expect(row[4]).toBe("REMBANG") // City
    expect(row[5]).toBe("ARIES PUTRA BETON") // Destination
    expect(row[6]).toBe(95000) // Rate per ton
    expect(row[7]).toBe(31.2) // Unloaded tonnage
    expect(row[8]).toBe(2964000) // Omset
    expect(row[9]).toBe(1532000) // Sangu
    expect(row[18]).toBe(1347000) // Profit
  })

  it("should generate descriptive filenames based on active filter", () => {
    expect(
      getTripsExportFilename({ truckId: "W8187UA", month: 9, year: 2025 })
    ).toBe("rekap-ritase-W8187UA-2025-09.xlsx")
    expect(
      getTripsExportFilename({ truckId: "ALL", month: "ALL", year: "ALL" })
    ).toBe("rekap-ritase-semua.xlsx")
    expect(getTripsExportFilename({ year: 2025 }, "csv")).toBe(
      "rekap-ritase-2025.csv"
    )
  })
})
