"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  RiAlertLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFilterOffLine,
  RiLoaderLine,
  RiMapPinLine,
  RiReceiptLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExpensesExportButton } from "@/features/expenses/expenses-export-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExpenseFormDialog } from "./expense-form-dialog"
import { ExpenseMobileCard } from "./expense-mobile-card"
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"
import { deleteExpense } from "./expenses.actions"
import { EXPENSE_CATEGORIES } from "./expenses.schema"

import type { Expense } from "@/db/schema"

export type ExpenseRecord = Expense

interface ExpensesTableProps {
  expenses: Expense[]
  initialFilter?: {
    truckId?: string
    month?: number
    year?: number
    category?: string
  }
}

const MONTH_NAMES = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
]

function formatPlateNumber(truckId: string): string {
  if (truckId === "W8187UA") return "W 8187 UA"
  if (truckId === "H8133OF") return "H 8133 OF"
  return truckId
}

function getCategoryBadge(category: string) {
  switch (category) {
    case "Servis":
      return (
        <Badge
          variant="outline"
          className="border-rose-500/30 bg-rose-500/10 text-[11px] font-medium text-rose-600 dark:text-rose-400"
        >
          Servis
        </Badge>
      )
    case "Onderdil":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-[11px] font-medium text-amber-600 dark:text-amber-400"
        >
          Onderdil
        </Badge>
      )
    case "BBM":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500/30 bg-yellow-500/10 text-[11px] font-medium text-yellow-600 dark:text-yellow-400"
        >
          BBM
        </Badge>
      )
    case "GPS":
      return (
        <Badge
          variant="outline"
          className="border-cyan-500/30 bg-cyan-500/10 text-[11px] font-medium text-cyan-600 dark:text-cyan-400"
        >
          GPS
        </Badge>
      )
    case "DP/Cicilan":
      return (
        <Badge
          variant="outline"
          className="border-indigo-500/30 bg-indigo-500/10 text-[11px] font-medium text-indigo-600 dark:text-indigo-400"
        >
          DP/Cicilan
        </Badge>
      )
    case "Administrasi":
      return (
        <Badge
          variant="outline"
          className="border-blue-500/30 bg-blue-500/10 text-[11px] font-medium text-blue-600 dark:text-blue-400"
        >
          Administrasi
        </Badge>
      )
    default:
      return (
        <Badge
          variant="outline"
          className="border-muted-foreground/30 bg-muted text-[11px] font-medium text-muted-foreground"
        >
          {category || "Lainnya"}
        </Badge>
      )
  }
}

export function ExpensesTable({ expenses, initialFilter }: ExpensesTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 20

  // Editing state
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Deleting state
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Current filters from URL query params
  const currentTruckId =
    searchParams.get("truckId") ?? initialFilter?.truckId ?? "ALL"
  const currentCategory =
    searchParams.get("category") ?? initialFilter?.category ?? "ALL"
  const currentMonth =
    searchParams.get("month") ??
    (initialFilter?.month ? String(initialFilter.month) : "ALL")
  const currentYear =
    searchParams.get("year") ??
    (initialFilter?.year ? String(initialFilter.year) : "ALL")

  const hasActiveFilter =
    currentTruckId !== "ALL" ||
    currentCategory !== "ALL" ||
    currentMonth !== "ALL" ||
    currentYear !== "ALL"

  function updateQuery(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "ALL" || !value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    setCurrentPage(1)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  function handleResetFilters() {
    setCurrentPage(1)
    startTransition(() => {
      router.push(pathname)
    })
  }

  // Handle delete action
  async function handleDeleteConfirm() {
    if (!deletingExpense) return
    try {
      setIsDeleting(true)
      const result = await deleteExpense(deletingExpense.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Catatan pengeluaran berhasil dihapus")
      setDeletingExpense(null)
      startTransition(() => {
        router.refresh()
      })
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menghapus pengeluaran"
      )
    } finally {
      setIsDeleting(false)
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(expenses.length / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, expenses.length)
  const paginatedExpenses = expenses.slice(startIndex, endIndex)

  return (
    <>
      <Card className="border border-border shadow-xs">
        {/* Header & Filter Toolbar */}
        <CardHeader className="flex flex-col gap-4 p-4 sm:p-6">
          <div>
            <CardTitle className="text-base font-semibold">
              Buku Pengeluaran & Perawatan Truk
            </CardTitle>
            <CardDescription className="text-xs">
              Daftar nota bengkel, onderdil, BBM, dan biaya operasional armada
            </CardDescription>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 pt-1 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
            {/* Truck Filter */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                Armada:
              </span>
              <Select
                value={currentTruckId}
                onValueChange={(val) => val && updateQuery("truckId", val)}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-34">
                  <SelectValue placeholder="Semua Armada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Armada</SelectItem>
                  <SelectItem value="W8187UA">W 8187 UA (Triyono)</SelectItem>
                  <SelectItem value="H8133OF">H 8133 OF (Khoirul)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                Kategori:
              </span>
              <Select
                value={currentCategory}
                onValueChange={(val) => val && updateQuery("category", val)}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-32">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Kategori</SelectItem>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Filter */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                Bulan:
              </span>
              <Select
                value={currentMonth}
                onValueChange={(val) => val && updateQuery("month", val)}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-30">
                  <SelectValue placeholder="Semua Bulan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Bulan</SelectItem>
                  {MONTH_NAMES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
              <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
                Tahun:
              </span>
              <Select
                value={currentYear}
                onValueChange={(val) => val && updateQuery("year", val)}
              >
                <SelectTrigger className="h-8 w-full text-xs sm:w-26">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset & Export Actions */}
            <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-auto">
              {hasActiveFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 gap-1 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RiFilterOffLine className="size-3.5" />
                  <span>Reset</span>
                </Button>
              )}

              {/* Export Kas Button */}
              <ExpensesExportButton
                expenses={expenses}
                filter={{
                  truckId: currentTruckId,
                  category: currentCategory,
                  month: currentMonth,
                  year: currentYear,
                }}
              />
            </div>
          </div>
        </CardHeader>

        {/* Table & Cards Content */}
        <CardContent className="p-4 sm:px-6 sm:pb-4">
          {/* Mobile View: Cards */}
          <div className="block space-y-3 md:hidden">
            {paginatedExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
                <RiReceiptLine className="size-8 text-muted-foreground/40" />
                <p className="font-medium text-foreground">
                  Belum ada catatan pengeluaran
                </p>
                <p className="text-xs text-muted-foreground">
                  {hasActiveFilter
                    ? "Coba sesuaikan atau reset filter di atas"
                    : "Gunakan tombol 'Catat Pengeluaran' untuk menambahkan data baru"}
                </p>
              </div>
            ) : (
              paginatedExpenses.map((item) => (
                <ExpenseMobileCard
                  key={item.id}
                  expense={item}
                  onEdit={(expense) => {
                    setEditingExpense(expense)
                    setIsEditDialogOpen(true)
                  }}
                  onDelete={setDeletingExpense}
                />
              ))
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden overflow-hidden rounded-lg border border-border md:block">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/30 hover:bg-muted/30">
                  <TableHead className="w-28 pl-6 text-xs font-semibold">
                    Tanggal
                  </TableHead>
                  <TableHead className="w-28 text-xs font-semibold">
                    Armada
                  </TableHead>
                  <TableHead className="w-28 text-xs font-semibold">
                    Kategori
                  </TableHead>
                  <TableHead className="min-w-55 text-xs font-semibold">
                    Deskripsi & Catatan
                  </TableHead>
                  <TableHead className="w-28 text-xs font-semibold">
                    Lokasi
                  </TableHead>
                  <TableHead className="w-32 text-right text-xs font-semibold">
                    Biaya Pokok
                  </TableHead>
                  <TableHead className="w-28 text-right text-xs font-semibold">
                    Admin Bank
                  </TableHead>
                  <TableHead className="w-32 text-right text-xs font-semibold">
                    Total Beban
                  </TableHead>
                  <TableHead className="w-20 pr-6 text-center text-xs font-semibold">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-32 text-center text-sm text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                        <RiReceiptLine className="size-8 text-muted-foreground/40" />
                        <p className="font-medium text-foreground">
                          Belum ada catatan pengeluaran
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hasActiveFilter
                            ? "Coba sesuaikan atau reset filter di atas"
                            : "Gunakan tombol 'Catat Pengeluaran' untuk menambahkan data baru"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedExpenses.map((item) => {
                    const amountNum = parseFloat(String(item.amount)) || 0
                    const adminNum =
                      parseFloat(String(item.adminFee ?? "0")) || 0
                    const totalBeban = amountNum + adminNum

                    return (
                      <TableRow
                        key={item.id}
                        className="border-border/60 transition-colors hover:bg-muted/40"
                      >
                        {/* Tanggal */}
                        <TableCell className="pl-6 text-xs font-medium text-muted-foreground">
                          {formatDateIndonesian(item.expenseDate)}
                        </TableCell>

                        {/* Armada */}
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-[11px] font-medium"
                          >
                            {formatPlateNumber(item.truckId)}
                          </Badge>
                        </TableCell>

                        {/* Kategori */}
                        <TableCell>{getCategoryBadge(item.category)}</TableCell>

                        {/* Deskripsi & Catatan Perbaikan */}
                        <TableCell className="py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-foreground">
                              {item.description}
                            </span>
                            {item.repairNotes && (
                              <span className="line-clamp-1 text-[11px] text-muted-foreground">
                                📝 {item.repairNotes}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Lokasi */}
                        <TableCell className="text-xs text-muted-foreground">
                          {item.location ? (
                            <span className="flex items-center gap-1">
                              <RiMapPinLine className="size-3 text-muted-foreground" />
                              {item.location}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </TableCell>

                        {/* Biaya Pokok */}
                        <TableCell className="text-right text-xs text-foreground tabular-nums">
                          {formatCurrency(amountNum)}
                        </TableCell>

                        {/* Biaya Admin Bank */}
                        <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                          {adminNum > 0 ? (
                            formatCurrency(adminNum)
                          ) : (
                            <span className="text-muted-foreground/40">-</span>
                          )}
                        </TableCell>

                        {/* Total Beban */}
                        <TableCell className="text-right text-xs font-semibold text-rose-600 tabular-nums dark:text-rose-400">
                          {formatCurrency(totalBeban)}
                        </TableCell>

                        {/* Aksi */}
                        <TableCell className="pr-6 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                setEditingExpense(item)
                                setIsEditDialogOpen(true)
                              }}
                              title="Edit Pengeluaran"
                            >
                              <RiEditLine className="size-3.5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => setDeletingExpense(item)}
                              title="Hapus Pengeluaran"
                            >
                              <RiDeleteBinLine className="size-3.5" />
                              <span className="sr-only">Hapus</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Footer & Pagination */}
        <CardFooter className="flex flex-col items-center justify-between gap-3 border-t border-border px-6 py-3.5 sm:flex-row">
          <div className="text-xs text-muted-foreground">
            Menampilkan{" "}
            <span className="font-medium text-foreground">
              {expenses.length === 0 ? 0 : startIndex + 1}
            </span>{" "}
            - <span className="font-medium text-foreground">{endIndex}</span>{" "}
            dari{" "}
            <span className="font-medium text-foreground">
              {expenses.length}
            </span>{" "}
            catatan pengeluaran
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-3 text-xs"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              <RiArrowLeftSLine className="size-4" />
              <span>Sebelumnya</span>
            </Button>
            <span className="text-xs text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-3 text-xs"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              <span>Berikutnya</span>
              <RiArrowRightSLine className="size-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Edit Form Dialog */}
      <ExpenseFormDialog
        expense={editingExpense}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) setEditingExpense(null)
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingExpense}
        onOpenChange={(open) => {
          if (!open) setDeletingExpense(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <RiAlertLine className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold">
                  Hapus Catatan Pengeluaran?
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Tindakan ini tidak dapat dibatalkan. Catatan beban ini akan
                  dihapus dari database armada.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {deletingExpense && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Tanggal:</span>
                <span className="font-medium text-foreground">
                  {formatDateIndonesian(deletingExpense.expenseDate)}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Armada:</span>
                <span className="font-medium text-foreground">
                  {formatPlateNumber(deletingExpense.truckId)}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Kategori:</span>
                <span className="font-medium text-foreground">
                  {deletingExpense.category}
                </span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Deskripsi:</span>
                <span className="font-medium text-foreground">
                  {deletingExpense.description}
                </span>
              </div>
              <div className="mt-1 flex justify-between border-t border-border/70 pt-1.5 font-bold">
                <span>Total Beban:</span>
                <span className="text-rose-600 dark:text-rose-400">
                  {formatCurrency(
                    (parseFloat(String(deletingExpense.amount)) || 0) +
                      (parseFloat(String(deletingExpense.adminFee ?? "0")) || 0)
                  )}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingExpense(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="gap-1.5"
            >
              {isDeleting && <RiLoaderLine className="size-3.5 animate-spin" />}
              <span>Hapus Pengeluaran</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
