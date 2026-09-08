import type { Expense } from "@/db/schema"
import type { ExcelSheetData } from "@/lib/export/excel-builder"

export function formatTruckPlate(truckId: string): string {
  if (truckId === "W8187UA") return "W 8187 UA"
  if (truckId === "H8133OF") return "H 8133 OF"
  return truckId
}

export function formatExpensesForExport(expenses: Expense[]): ExcelSheetData {
  const headers = [
    "No.",
    "Tanggal",
    "Armada",
    "Kategori",
    "Uraian / Keterangan",
    "Lokasi",
    "Catatan Perbaikan",
    "Nominal Beban (Rp)",
    "Biaya Admin (Rp)",
    "Total Biaya (Rp)",
  ]

  const rows = expenses.map((exp, idx) => {
    const amount = parseFloat(exp.amount || "0")
    const adminFee = parseFloat(exp.adminFee || "0")
    const total = amount + adminFee

    return [
      idx + 1,
      exp.expenseDate,
      formatTruckPlate(exp.truckId),
      exp.category,
      exp.description,
      exp.location ?? "-",
      exp.repairNotes ?? "-",
      amount,
      adminFee,
      total,
    ]
  })

  return {
    sheetName: "Rekap Pengeluaran",
    headers,
    rows,
  }
}

export interface ExpenseExportFilter {
  truckId?: string | null
  category?: string | null
  month?: string | number | null
  year?: string | number | null
}

export function getExpensesExportFilename(
  filter?: ExpenseExportFilter,
  extension: "xlsx" | "csv" = "xlsx"
): string {
  const parts: string[] = ["rekap-pengeluaran"]

  if (filter?.truckId && filter.truckId !== "ALL") {
    parts.push(filter.truckId)
  }

  if (filter?.category && filter.category !== "ALL") {
    parts.push(filter.category)
  }

  const hasYear = filter?.year && filter.year !== "ALL"
  const hasMonth = filter?.month && filter.month !== "ALL"

  if (hasYear && hasMonth) {
    const padMonth = String(filter.month).padStart(2, "0")
    parts.push(`${filter.year}-${padMonth}`)
  } else if (hasYear) {
    parts.push(String(filter.year))
  } else if (hasMonth) {
    const padMonth = String(filter.month).padStart(2, "0")
    parts.push(`bulan-${padMonth}`)
  }

  if (parts.length === 1) {
    parts.push("semua")
  }

  return `${parts.join("-")}.${extension}`
}
