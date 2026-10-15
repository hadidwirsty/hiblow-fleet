import type { Metadata } from "next"
import { RiReceiptLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { prepareCategoryChartData } from "@/domain/expense-category"
import { ExpenseFormDialog } from "@/features/expenses/expense-form-dialog"
import { ExpensesCategoryChart } from "@/features/expenses/expenses-category-chart"
import { ExpensesExportButton } from "@/features/expenses/expenses-export-button"
import {
  getExpensesCategoryBreakdown,
  getExpensesSummary,
  listExpenses,
} from "@/features/expenses/expenses.queries"
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/features/expenses/expenses.schema"
import { ExpensesSummary } from "@/features/expenses/expenses-summary"
import { ExpensesTable } from "@/features/expenses/expenses-table"

interface ExpensesPageProps {
  searchParams: Promise<{
    truckId?: string
    month?: string
    year?: string
    category?: string
  }>
}

export const metadata: Metadata = {
  title: "Pengeluaran Armada",
  description:
    "Buku catatan beban operasional, servis bengkel, onderdil, BBM, dan biaya perbankan armada HW Trans",
}

export const dynamic = "force-dynamic"

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const params = await searchParams

  const truckId =
    params.truckId === "W8187UA" || params.truckId === "H8133OF"
      ? params.truckId
      : undefined

  const category =
    params.category &&
    EXPENSE_CATEGORIES.includes(params.category as ExpenseCategory)
      ? params.category
      : undefined

  const month = params.month ? parseInt(params.month, 10) : undefined
  const year = params.year ? parseInt(params.year, 10) : undefined

  const filter = {
    truckId,
    category,
    month: month && month >= 1 && month <= 12 ? month : undefined,
    year: year && year >= 2024 ? year : undefined,
  }

  const [expensesData, summary, breakdown] = await Promise.all([
    listExpenses(filter),
    getExpensesSummary(filter),
    getExpensesCategoryBreakdown(filter),
  ])

  const chartData = prepareCategoryChartData(breakdown, summary.totalExpenses)

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Page Header (Standar 1:1 /rates & /trips) */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiReceiptLine className="size-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Pengeluaran Armada
            </h1>
            <Badge variant="outline" className="text-xs font-normal">
              {summary.totalCount.toLocaleString("id-ID")} Transaksi
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Buku catatan beban operasional, servis bengkel, onderdil, BBM, dan
            biaya perbankan armada HW Trans
          </p>
        </div>

        {/* Action Controls Group: Ekspor & Tambah Pengeluaran */}
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2.5">
          <ExpenseFormDialog />
          <ExpensesExportButton expenses={expensesData} filter={filter} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full min-w-0 space-y-6 px-4 lg:px-6">
        {/* KPI Metric Cards */}
        <ExpensesSummary summary={summary} />

        {/* Grafik Komposisi Biaya per Kategori */}
        <div className="rounded-2xl border border-border/80 bg-card/75 p-4 shadow-xs backdrop-blur-xs sm:p-5">
          <div className="mb-3 space-y-0.5">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Komposisi Biaya per Kategori
            </h2>
            <p className="text-xs text-muted-foreground">
              Proporsi pengeluaran berdasarkan jenis beban operasional armada
            </p>
          </div>
          <ExpensesCategoryChart
            data={chartData}
            totalExpenses={summary.totalExpenses}
          />
        </div>

        {/* Expenses Data Table Section */}
        <div className="w-full min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Daftar Catatan Pengeluaran
              </h2>
              <p className="text-xs text-muted-foreground">
                Gunakan pencarian untuk menyaring nomor nota, uraian barang,
                toko, atau lokasi
              </p>
            </div>
          </div>

          <ExpensesTable expenses={expensesData} initialFilter={filter} />
        </div>
      </div>
    </div>
  )
}
