import { RiCalendarLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { prepareCategoryChartData } from "@/domain/expense-category"
import { ExpenseFormDialog } from "@/features/expenses/expense-form-dialog"
import { ExpensesCategoryChart } from "@/features/expenses/expenses-category-chart"
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
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Page Title & Action Controls Bar */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Pengeluaran Truk
            </h1>
            <span className="hidden items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              <RiCalendarLine className="size-3" />
              Buku Kas
            </span>
            <Badge variant="outline" className="text-xs font-normal">
              {expensesData.length} Transaksi
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Buku catatan beban operasional, servis bengkel, onderdil, BBM, dan
            biaya perbankan armada
          </p>
        </div>

        {/* Modal Dialog Form Catat Pengeluaran Baru */}
        <div className="flex items-center gap-2.5">
          <ExpenseFormDialog />
        </div>
      </div>

      {/* KPI Summary Cards */}
      <ExpensesSummary summary={summary} />

      {/* Category Breakdown Chart */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Komposisi Biaya per Kategori
            </CardTitle>
            <CardDescription className="text-xs">
              Proporsi pengeluaran berdasarkan jenis biaya operasional armada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpensesCategoryChart
              data={chartData}
              totalExpenses={summary.totalExpenses}
            />
          </CardContent>
        </Card>
      </div>

      {/* Interactive Expenses Table */}
      <div className="px-4 lg:px-6">
        <ExpensesTable expenses={expensesData} initialFilter={filter} />
      </div>
    </div>
  )
}
