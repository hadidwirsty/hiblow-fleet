import { describe, expect, it } from "vitest"

import {
  formatExpensesForExport,
  getExpensesExportFilename,
} from "@/features/expenses/expenses.export"
import type { Expense } from "@/db/schema"

describe("expenses.export", () => {
  const mockExpenses: Expense[] = [
    {
      id: "exp-uuid-1",
      truckId: "W8187UA",
      expenseDate: "2025-09-03",
      category: "Servis",
      description: "Ganti oli mesin Meditran & filter",
      amount: "1850000.00",
      adminFee: "6500.00",
      location: "Tuban",
      repairNotes: "Bengkel Berkah",
      createdAt: new Date(),
    },
  ]

  it("should format expense records into clean tabular headers and rows", () => {
    const data = formatExpensesForExport(mockExpenses)

    expect(data.sheetName).toBe("Rekap Pengeluaran")
    expect(data.headers).toContain("No.")
    expect(data.headers).toContain("Tanggal")
    expect(data.headers).toContain("Armada")
    expect(data.headers).toContain("Kategori")
    expect(data.headers).toContain("Uraian / Keterangan")
    expect(data.headers).toContain("Nominal Beban (Rp)")
    expect(data.headers).toContain("Biaya Admin (Rp)")
    expect(data.headers).toContain("Total Biaya (Rp)")

    expect(data.rows).toHaveLength(1)
    const row = data.rows[0]
    expect(row[0]).toBe(1)
    expect(row[1]).toBe("2025-09-03")
    expect(row[2]).toBe("W 8187 UA")
    expect(row[3]).toBe("Servis")
    expect(row[4]).toBe("Ganti oli mesin Meditran & filter")
    expect(row[5]).toBe("Tuban")
    expect(row[6]).toBe("Bengkel Berkah")
    expect(row[7]).toBe(1850000)
    expect(row[8]).toBe(6500)
    expect(row[9]).toBe(1856500) // amount + adminFee
  })

  it("should generate descriptive filenames based on active filter", () => {
    expect(
      getExpensesExportFilename({
        truckId: "H8133OF",
        category: "Servis",
        month: 9,
        year: 2025,
      })
    ).toBe("rekap-pengeluaran-H8133OF-Servis-2025-09.xlsx")

    expect(getExpensesExportFilename({}, "csv")).toBe(
      "rekap-pengeluaran-semua.csv"
    )
  })
})
