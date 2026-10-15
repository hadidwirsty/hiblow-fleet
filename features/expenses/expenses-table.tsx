"use client"

import { useMemo, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  RiArrowDownSLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiFilterLine,
  RiMapPinLine,
  RiReceiptLine,
  RiSearchLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
import { formatPlateNumber, getDriverAndTruck } from "@/domain/trucks"
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"
import { useUIStore } from "@/stores/theme"
import { ExpenseDetailSheet } from "./expense-detail-sheet"
import { ExpenseFormDialog } from "./expense-form-dialog"
import { ExpenseMobileCard } from "./expense-mobile-card"
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

  // Client-side search & pagination
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const { setModalDelete, setModalSuccess } = useUIStore()

  // State untuk Detail Sheet & Edit Dialog
  const [selectedDetailExpense, setSelectedDetailExpense] =
    useState<Expense | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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
    Boolean(search.trim()) ||
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
    setSearch("")
    setCurrentPage(1)
    startTransition(() => {
      router.push(pathname)
    })
  }

  // Filter pencarian instan klien
  const filteredExpenses = useMemo(() => {
    if (!search.trim()) return expenses
    const q = search.toLowerCase()
    return expenses.filter(
      (item) =>
        item.description.toLowerCase().includes(q) ||
        (item.quantity && item.quantity.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.repairNotes && item.repairNotes.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        formatPlateNumber(item.truckId).toLowerCase().includes(q)
    )
  }, [expenses, search])

  // Handle delete action via global modal
  const promptDeleteExpense = (item: Expense) => {
    const totalAmount =
      (parseFloat(String(item.amount)) || 0) +
      (parseFloat(String(item.adminFee ?? "0")) || 0)
    setModalDelete({
      open: true,
      title: "Hapus Catatan Pengeluaran",
      message: `Apakah Anda yakin ingin menghapus catatan pengeluaran "${item.description}" (${formatPlateNumber(item.truckId)} - ${formatCurrency(totalAmount)})? Tindakan ini tidak dapat dibatalkan.`,
      action: async () => {
        try {
          const result = await deleteExpense(item.id)
          if (!result.success) {
            toast.error(result.error || "Gagal menghapus pengeluaran")
            return
          }
          setModalSuccess({
            open: true,
            title: "Pengeluaran Berhasil Dihapus",
            message: `Catatan pengeluaran "${item.description}" telah dihapus dari sistem.`,
            actionMessage: "Tutup",
          })
          startTransition(() => {
            router.refresh()
          })
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Gagal menghapus pengeluaran"
          )
        }
      },
    })
  }

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredExpenses.length / pageSize))
  const startIndex =
    filteredExpenses.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, filteredExpenses.length)
  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * pageSize,
    endIndex
  )

  return (
    <div className="space-y-4">
      {/* 1. Search Bar & Toolbar Filter Kapsul Terpadu (1:1 Standar /rates & /trips) */}
      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        {/* Search Bar Instan */}
        <div className="relative w-full 2xl:max-w-xs 2xl:shrink-0">
          <RiSearchLine className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Cari pengeluaran, vendor, nota, atau kategori..."
            className="h-10 w-full rounded-xl border-border/70 bg-card/60 pl-9.5 text-xs shadow-2xs focus-visible:ring-1"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <RiCloseLine className="size-4" />
              <span className="sr-only">Hapus pencarian</span>
            </button>
          )}
        </div>

        {/* Filter Group: Kapsul Terpadu Responsif (Tinggi h-10 di layar sangat lebar, fleksibel wrap di tablet & laptop) */}
        <div className="flex w-full flex-col gap-2 rounded-xl border border-border/80 bg-muted/40 p-2 shadow-2xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 2xl:h-10 2xl:w-auto 2xl:flex-nowrap 2xl:px-2 2xl:py-0">
          {/* Header Filter di Mobile */}
          <div className="flex items-center justify-between px-0.5 text-xs font-semibold text-muted-foreground sm:hidden">
            <span className="flex items-center gap-1.5">
              <RiFilterLine className="size-3.5 text-primary" />
              <span>Filter Data:</span>
            </span>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex cursor-pointer items-center gap-1 text-[11px] font-medium text-destructive hover:underline"
              >
                <RiCloseLine className="size-3" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Label Filter di Tablet & Desktop */}
          <div className="hidden shrink-0 items-center gap-1.5 px-1 text-xs font-medium text-muted-foreground sm:flex">
            <RiFilterLine className="size-3.5 text-primary" />
            <span>Filter:</span>
          </div>

          {/* 1. Filter Armada */}
          <Select
            value={currentTruckId}
            onValueChange={(val) => val && updateQuery("truckId", val)}
          >
            <SelectTrigger className="h-8.5 w-full rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-7.5 sm:min-w-0 sm:flex-1 2xl:w-36 2xl:flex-none">
              <SelectValue>
                {currentTruckId === "ALL"
                  ? "Semua Armada"
                  : formatPlateNumber(currentTruckId)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectItem value="ALL" className="text-xs font-medium">
                Semua Armada
              </SelectItem>
              <SelectItem value="W8187UA" className="text-xs">
                W 8187 UA (Triyono)
              </SelectItem>
              <SelectItem value="H8133OF" className="text-xs">
                H 8133 OF (Khoirul)
              </SelectItem>
            </SelectContent>
          </Select>

          {/* 2. Filter Kategori */}
          <Select
            value={currentCategory}
            onValueChange={(val) => val && updateQuery("category", val)}
          >
            <SelectTrigger className="h-8.5 w-full rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-7.5 sm:min-w-0 sm:flex-1 2xl:w-36 2xl:flex-none">
              <SelectValue>
                {currentCategory === "ALL" ? "Semua Kategori" : currentCategory}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectItem value="ALL" className="text-xs font-medium">
                Semua Kategori
              </SelectItem>
              {EXPENSE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 3. Filter Bulan */}
          <Select
            value={currentMonth}
            onValueChange={(val) => val && updateQuery("month", val)}
          >
            <SelectTrigger className="h-8.5 w-full rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-7.5 sm:min-w-0 sm:flex-1 2xl:w-32 2xl:flex-none">
              <SelectValue>
                {currentMonth === "ALL"
                  ? "Semua Bulan"
                  : MONTH_NAMES.find((m) => m.value === currentMonth)?.label ||
                    "Bulan"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectItem value="ALL" className="text-xs font-medium">
                Semua Bulan
              </SelectItem>
              {MONTH_NAMES.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 4. Filter Tahun */}
          <Select
            value={currentYear}
            onValueChange={(val) => val && updateQuery("year", val)}
          >
            <SelectTrigger className="h-8.5 w-full rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-7.5 sm:min-w-0 sm:flex-1 2xl:w-26 2xl:flex-none">
              <SelectValue>
                {currentYear === "ALL" ? "Semua Tahun" : currentYear}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectItem value="ALL" className="text-xs font-medium">
                Semua
              </SelectItem>
              <SelectItem value="2026" className="text-xs">
                2026
              </SelectItem>
              <SelectItem value="2025" className="text-xs">
                2025
              </SelectItem>
              <SelectItem value="2024" className="text-xs">
                2024
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Tombol Reset Filter */}
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="hidden h-7.5 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <RiCloseLine className="size-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* 2. Mobile Cards View (< md) */}
      <div className="block space-y-3 md:hidden">
        {paginatedExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-card/60 py-12 text-center">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <RiReceiptLine className="size-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {hasActiveFilter
                  ? "Tidak Ada Transaksi yang Cocok"
                  : "Belum Ada Catatan Pengeluaran"}
              </p>
              <p className="max-w-xs text-xs text-muted-foreground">
                {hasActiveFilter
                  ? "Tidak ada data pengeluaran yang sesuai dengan pencarian atau filter aktif Anda."
                  : "Daftar pengeluaran armada masih kosong. Mulai catat nota pertama Anda."}
              </p>
            </div>
            {hasActiveFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="mt-2 h-8 text-xs"
              >
                Reset Filter
              </Button>
            )}
          </div>
        ) : (
          paginatedExpenses.map((item) => (
            <ExpenseMobileCard
              key={item.id}
              expense={item}
              onViewDetail={(expense) => {
                setSelectedDetailExpense(expense)
                setIsDetailOpen(true)
              }}
              onEdit={(expense) => {
                setEditingExpense(expense)
                setIsEditDialogOpen(true)
              }}
              onDelete={promptDeleteExpense}
            />
          ))
        )}
      </div>

      {/* 3. Desktop Table Container (>= md) (1:1 Standar /rates & /trips) */}
      <div className="hidden w-full max-w-full min-w-0 overflow-hidden rounded-xl border bg-card shadow-xs md:block">
        <Table containerClassName="max-h-[calc(100vh-14rem)]">
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/95">
              <TableHead className="w-12 py-3 text-center text-xs font-semibold whitespace-nowrap text-foreground">
                No
              </TableHead>
              <TableHead className="min-w-32 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                Tanggal
              </TableHead>
              <TableHead className="min-w-32 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                Armada
              </TableHead>
              <TableHead className="min-w-28 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                Kategori
              </TableHead>
              <TableHead className="min-w-64 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                Uraian Pengeluaran & Rincian
              </TableHead>
              <TableHead className="min-w-40 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                Keterangan / Lokasi
              </TableHead>
              <TableHead className="min-w-32 py-3 text-right text-xs font-semibold whitespace-nowrap text-foreground">
                Biaya Pokok
              </TableHead>
              <TableHead className="min-w-28 py-3 text-right text-xs font-semibold whitespace-nowrap text-foreground">
                Admin Bank
              </TableHead>
              <TableHead className="min-w-32 py-3 text-right text-xs font-semibold whitespace-nowrap text-foreground">
                Total Beban
              </TableHead>
              <TableHead className="w-24 min-w-20 py-3 text-center text-xs font-semibold whitespace-nowrap text-foreground">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedExpenses.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={10} className="p-0">
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <RiReceiptLine className="size-6 text-primary" />
                    </div>
                    <div className="max-w-md space-y-1">
                      <p className="text-base font-semibold text-foreground">
                        {hasActiveFilter
                          ? "Tidak Ada Catatan yang Cocok"
                          : "Belum Ada Catatan Pengeluaran"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {hasActiveFilter
                          ? "Tidak ada data pengeluaran yang sesuai dengan pencarian atau filter aktif Anda. Silakan ubah kata kunci atau klik tombol reset."
                          : "Buku catatan pengeluaran armada masih kosong. Mulai tambahkan transaksi pengeluaran baru."}
                      </p>
                    </div>
                    {hasActiveFilter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-3 h-8 gap-1.5 px-3 text-xs shadow-xs"
                      >
                        <RiCloseLine className="size-3.5" />
                        <span>Reset Filter</span>
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedExpenses.map((item, idx) => {
                const amountNum = parseFloat(String(item.amount)) || 0
                const adminNum = parseFloat(String(item.adminFee ?? "0")) || 0
                const totalBeban = amountNum + adminNum
                const rowNumber = (currentPage - 1) * pageSize + idx + 1
                const driverInfo = getDriverAndTruck(item.truckId)

                return (
                  <TableRow
                    key={item.id}
                    className="text-xs transition-colors hover:bg-muted/30"
                  >
                    {/* 1. No */}
                    <TableCell className="text-center font-mono whitespace-nowrap text-muted-foreground">
                      {rowNumber}
                    </TableCell>

                    {/* 2. Tanggal */}
                    <TableCell className="text-left font-medium whitespace-nowrap text-foreground">
                      {formatDateIndonesian(item.expenseDate, true)}
                    </TableCell>

                    {/* 3. Armada */}
                    <TableCell className="text-left whitespace-nowrap">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-foreground">
                          {driverInfo.driver}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            item.truckId === "W8187UA"
                              ? "border-primary/40 bg-primary/10 font-mono text-[10px] font-semibold text-primary"
                              : "border-amber-500/40 bg-amber-500/10 font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                          }
                        >
                          {driverInfo.plate}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* 4. Kategori */}
                    <TableCell className="text-left whitespace-nowrap">
                      {getCategoryBadge(item.category)}
                    </TableCell>

                    {/* 5. Uraian Pengeluaran & Rincian */}
                    <TableCell className="py-2.5 text-left">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDetailExpense(item)
                              setIsDetailOpen(true)
                            }}
                            className="cursor-pointer text-left font-semibold text-foreground transition-colors hover:text-primary"
                          >
                            {item.description}
                          </button>
                          {item.quantity && (
                            <Badge
                              variant="outline"
                              className="shrink-0 border-border/80 bg-muted/40 text-[10px] font-medium text-muted-foreground"
                            >
                              {item.quantity}
                            </Badge>
                          )}
                        </div>
                        {item.repairNotes && (
                          <span className="line-clamp-1 text-[11px] text-muted-foreground">
                            📝 {item.repairNotes}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* 6. Keterangan / Lokasi */}
                    <TableCell className="text-left text-muted-foreground">
                      {item.location ? (
                        <span className="flex items-center gap-1">
                          <RiMapPinLine className="size-3 shrink-0 text-muted-foreground" />
                          <span className="truncate">{item.location}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
                    </TableCell>

                    {/* 7. Biaya Pokok */}
                    <TableCell className="text-right font-mono whitespace-nowrap text-foreground tabular-nums">
                      {formatCurrency(amountNum)}
                    </TableCell>

                    {/* 8. Admin Bank */}
                    <TableCell className="text-right font-mono whitespace-nowrap text-muted-foreground tabular-nums">
                      {adminNum > 0 ? (
                        formatCurrency(adminNum)
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
                    </TableCell>

                    {/* 9. Total Beban */}
                    <TableCell className="text-right font-mono font-bold whitespace-nowrap text-rose-600 tabular-nums dark:text-rose-400">
                      {formatCurrency(totalBeban)}
                    </TableCell>

                    {/* 10. Aksi (DropdownMenu Standar /rates & /trips) */}
                    <TableCell className="text-center whitespace-nowrap">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7.5 gap-1.5 rounded-lg border-border/70 px-2.5 text-xs font-medium text-foreground shadow-2xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                            >
                              <span>Aksi</span>
                              <RiArrowDownSLine className="size-3.5 text-muted-foreground" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="text-xs">
                              Aksi Pengeluaran
                            </DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs"
                              onClick={() => {
                                setSelectedDetailExpense(item)
                                setIsDetailOpen(true)
                              }}
                            >
                              <RiEyeLine className="size-3.5 text-muted-foreground" />
                              <span>Lihat Detail</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs"
                              onClick={() => {
                                setEditingExpense(item)
                                setIsEditDialogOpen(true)
                              }}
                            >
                              <RiEditLine className="size-3.5 text-muted-foreground" />
                              <span>Ubah Data</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => promptDeleteExpense(item)}
                            >
                              <RiDeleteBinLine className="size-3.5" />
                              <span>Hapus Catatan</span>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. Pagination Footer (1:1 Standar /rates & /trips) */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border bg-card p-3 text-xs text-muted-foreground shadow-xs sm:flex-row sm:px-4">
        <div>
          Menampilkan <strong>{startIndex}</strong> -{" "}
          <strong>{endIndex}</strong> dari{" "}
          <strong>{filteredExpenses.length}</strong> catatan pengeluaran
          {search.trim() && (
            <span className="ml-1 text-[11px] text-primary">
              (dari pencarian &ldquo;{search}&rdquo;)
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Pilihan Jumlah Baris per Halaman (Hanya Tampil di Tablet & Desktop) */}
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="text-[11px] text-muted-foreground">Baris:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                if (val) {
                  setPageSize(Number(val))
                  setCurrentPage(1)
                }
              }}
            >
              <SelectTrigger className="h-7.5 w-24 rounded-lg border-border/60 bg-background px-2 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50">
                <SelectValue>{pageSize} Baris</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs font-medium">
                  10 Baris
                </SelectItem>
                <SelectItem value="25" className="text-xs font-medium">
                  25 Baris
                </SelectItem>
                <SelectItem value="50" className="text-xs font-medium">
                  50 Baris
                </SelectItem>
                <SelectItem value="100" className="text-xs font-medium">
                  100 Baris
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-7.5 px-2.5 text-xs"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Sebelumnya
          </Button>
          <span className="px-1 text-xs font-medium text-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7.5 px-2.5 text-xs"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Selanjutnya
          </Button>
        </div>
      </div>

      {/* 5. Slide-over Sheet: Detail Catatan Pengeluaran */}
      <ExpenseDetailSheet
        expense={selectedDetailExpense}
        open={isDetailOpen}
        onOpenChange={(open) => {
          setIsDetailOpen(open)
          if (!open) setSelectedDetailExpense(null)
        }}
        onEdit={(expense) => {
          setEditingExpense(expense)
          setIsEditDialogOpen(true)
        }}
        onDelete={promptDeleteExpense}
      />

      {/* 6. Responsive Dialog: Ubah Catatan Pengeluaran */}
      <ExpenseFormDialog
        expense={editingExpense}
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open)
          if (!open) setEditingExpense(null)
        }}
      />
    </div>
  )
}
