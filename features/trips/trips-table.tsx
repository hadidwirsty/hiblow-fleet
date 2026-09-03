"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFilterOffLine,
  RiTruckLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"
import type { trips } from "@/src/db/schema"

export type TripRecord = typeof trips.$inferSelect

interface TripsTableProps {
  trips: TripRecord[]
  initialFilter?: {
    truckId?: string
    month?: number
    year?: number
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

export function TripsTable({ trips, initialFilter }: TripsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 25

  // Read current filters
  const currentTruckId =
    searchParams.get("truckId") ?? initialFilter?.truckId ?? "ALL"
  const currentMonth =
    searchParams.get("month") ??
    (initialFilter?.month ? String(initialFilter.month) : "ALL")
  const currentYear =
    searchParams.get("year") ??
    (initialFilter?.year ? String(initialFilter.year) : "ALL")

  const hasActiveFilter =
    currentTruckId !== "ALL" || currentMonth !== "ALL" || currentYear !== "ALL"

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

  // Pagination calculations
  const totalPages = Math.ceil(trips.length / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, trips.length)
  const paginatedTrips = trips.slice(startIndex, endIndex)

  return (
    <div className="flex flex-col gap-4">
      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Truck Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Truk:
            </span>
            <Select
              value={currentTruckId}
              onValueChange={(val) => val && updateQuery("truckId", val)}
            >
              <SelectTrigger className="h-8 w-35 text-xs">
                <SelectValue placeholder="Semua Truk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Truk</SelectItem>
                <SelectItem value="W8187UA">W 8187 UA</SelectItem>
                <SelectItem value="H8133OF">H 8133 OF</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Bulan:
            </span>
            <Select
              value={currentMonth}
              onValueChange={(val) => val && updateQuery("month", val)}
            >
              <SelectTrigger className="h-8 w-32.5 text-xs">
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Tahun:
            </span>
            <Select
              value={currentYear}
              onValueChange={(val) => val && updateQuery("year", val)}
            >
              <SelectTrigger className="h-8 w-27.5 text-xs">
                <SelectValue placeholder="Semua Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset Filter Button */}
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <RiFilterOffLine className="size-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>

        {/* Status Loading indicator */}
        <div className="text-xs text-muted-foreground">
          {isPending ? (
            <span className="animate-pulse font-medium text-primary">
              Memuat data...
            </span>
          ) : (
            <span>
              Total: <strong>{trips.length}</strong> ritase
            </span>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-15 text-[11px] font-semibold tracking-wider uppercase">
                No
              </TableHead>
              <TableHead className="w-27.5 text-[11px] font-semibold tracking-wider uppercase">
                Truk
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider uppercase">
                Tgl Order
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider uppercase">
                Tgl Bongkar
              </TableHead>
              <TableHead className="text-[11px] font-semibold tracking-wider uppercase">
                Kota & Pabrik Tujuan
              </TableHead>
              <TableHead className="text-right text-[11px] font-semibold tracking-wider uppercase">
                Tarif / Ton
              </TableHead>
              <TableHead className="text-right text-[11px] font-semibold tracking-wider uppercase">
                Tonase
              </TableHead>
              <TableHead className="text-right text-[11px] font-semibold tracking-wider uppercase">
                Omset
              </TableHead>
              <TableHead className="text-right text-[11px] font-semibold tracking-wider uppercase">
                Sangu
              </TableHead>
              <TableHead className="text-right text-[11px] font-semibold tracking-wider uppercase">
                Laba Ritase
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTrips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <RiTruckLine className="size-8 stroke-[1.5]" />
                    <p className="text-sm font-medium">Tidak ada data ritase</p>
                    <p className="text-xs">
                      Tidak ditemukan ritase yang cocok dengan filter yang
                      dipilih.
                    </p>
                    {hasActiveFilter && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="mt-2 text-xs"
                      >
                        Reset Filter
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedTrips.map((trip) => {
                const omsetNum = parseFloat(trip.omset)
                const sanguNum = parseFloat(trip.sangu)
                const profitNum = parseFloat(trip.profit)
                const rateNum = parseFloat(trip.ratePerTon)
                const tonnageNum = parseFloat(trip.unloadedTonnage)

                return (
                  <TableRow
                    key={trip.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                      #{trip.orderNumber}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge
                        variant="outline"
                        className={
                          trip.truckId === "W8187UA"
                            ? "border-primary/40 bg-primary/5 font-mono text-[11px] text-primary"
                            : "border-amber-500/40 bg-amber-500/5 font-mono text-[11px] text-amber-600 dark:text-amber-400"
                        }
                      >
                        {trip.truckId}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 text-xs whitespace-nowrap text-muted-foreground">
                      {formatDateIndonesian(trip.orderDate, true)}
                    </TableCell>
                    <TableCell className="py-3 text-xs whitespace-nowrap text-muted-foreground">
                      {trip.unloadingDate
                        ? formatDateIndonesian(trip.unloadingDate, true)
                        : "-"}
                    </TableCell>
                    <TableCell className="max-w-55 py-3">
                      <div className="truncate text-xs font-medium text-foreground">
                        {trip.destinationCity}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {trip.destinationName}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs text-muted-foreground">
                      {formatCurrency(rateNum)}
                    </TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs font-semibold">
                      {tonnageNum.toFixed(2)} ton
                    </TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs text-foreground">
                      {formatCurrency(omsetNum)}
                    </TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs text-muted-foreground">
                      {formatCurrency(sanguNum)}
                    </TableCell>
                    <TableCell className="py-3 text-right font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(profitNum)}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {trips.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row">
            <div>
              Menampilkan <strong>{startIndex + 1}</strong> s/d{" "}
              <strong>{endIndex}</strong> dari <strong>{trips.length}</strong>{" "}
              ritase
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2.5 text-xs"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <RiArrowLeftSLine className="size-4" />
                <span>Sebelumnya</span>
              </Button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 px-2.5 text-xs"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <span>Berikutnya</span>
                <RiArrowRightSLine className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
