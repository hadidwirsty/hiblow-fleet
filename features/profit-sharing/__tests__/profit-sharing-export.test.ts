import { describe, expect, it } from "vitest"

import {
  formatProfitSharingForCsv,
  formatProfitSharingForExcel,
  getProfitSharingExportFilename,
} from "@/features/profit-sharing/profit-sharing.export"
import type { ProfitSharingPeriodDetail } from "@/features/profit-sharing/profit-sharing.queries"

describe("profit-sharing.export", () => {
  const mockPeriod: ProfitSharingPeriodDetail = {
    id: "period-uuid-1",
    title: "Bagi Hasil September 2025",
    startDate: "2025-09-01",
    endDate: "2025-09-30",
    totalIncome: "45000000.00",
    totalExpenses: "15000000.00",
    grossBalance: "30000000.00",
    managerCommissionRate: "0.0500",
    managerCommissionAmount: "1500000.00",
    distributableProfit: "28500000.00",
    fleetValuation: "580000000.00",
    managerProfit: "22112068.97",
    managerTakeHome: "23612068.97",
    status: "finalized",
    createdAt: new Date(),
    shares: [
      {
        id: "share-1",
        periodId: "period-uuid-1",
        partnerName: "Alfiah",
        partnerUserId: null,
        capitalShare: "50000000.00",
        sharePercentage: "0.086207",
        payoutAmount: "2456896.55",
        notes: null,
      },
      {
        id: "share-2",
        periodId: "period-uuid-1",
        partnerName: "Mas Dhian",
        partnerUserId: null,
        capitalShare: "75000000.00",
        sharePercentage: "0.129310",
        payoutAmount: "3685344.83",
        notes: null,
      },
      {
        id: "share-3",
        periodId: "period-uuid-1",
        partnerName: "Hadid",
        partnerUserId: null,
        capitalShare: "4000000.00",
        sharePercentage: "0.006897",
        payoutAmount: "196551.72",
        notes: null,
      },
    ],
  }

  it("should generate 2 structured sheets for Excel export", () => {
    const sheets = formatProfitSharingForExcel(mockPeriod)

    expect(sheets).toHaveLength(2)
    expect(sheets[0].sheetName).toBe("Ringkasan Laba")
    expect(sheets[1].sheetName).toBe("Dividen Investor")

    // Summary sheet check
    const summaryRows = sheets[0].rows
    expect(summaryRows).toEqual(
      expect.arrayContaining([
        ["Judul Periode", "Bagi Hasil September 2025"],
        ["Total Omset Ritase", 45000000],
        ["Beban Operasional Riil", 15000000],
        ["Laba Bersih Siap Dibagi", 28500000],
        ["Komisi Pengelola (5%)", 1500000],
      ])
    )

    // Investor sheet check
    const investorRows = sheets[1].rows
    expect(investorRows).toHaveLength(4) // 3 partners + 1 total row
    expect(investorRows[0][1]).toBe("Alfiah")
    expect(investorRows[0][2]).toBe(50000000)
    expect(investorRows[0][3]).toBe("8.6207%")
  })

  it("should generate clean single-sheet CSV structure", () => {
    const csvData = formatProfitSharingForCsv(mockPeriod)

    expect(csvData.sheetName).toBe("Bagi Hasil")
    expect(csvData.headers).toContain("Nama Pemodal / Pos")
    expect(csvData.headers).toContain("Nominal (Rp)")
  })

  it("should generate descriptive filename", () => {
    expect(getProfitSharingExportFilename(mockPeriod, "xlsx")).toBe(
      "laporan-bagi-hasil-september-2025.xlsx"
    )
    expect(getProfitSharingExportFilename(mockPeriod, "csv")).toBe(
      "laporan-bagi-hasil-september-2025.csv"
    )
  })
})
