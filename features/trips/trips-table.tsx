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
import { TripsExportButton } from "@/features/trips/trips-export-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import type { trips } from "@/db/schema"

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

function formatPlateNumber(truckId: string): string {
  if (truckId === "W8187UA") return "W 8187 UA"
  if (truckId === "H8133OF") return "H 8133 OF"
  return truckId
}

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
    <Card className="border-border bg-card/60 shadow-xs backdrop-blur-xs">
      {/* Integrated Header & Filter Toolbar */}
      <CardHeader className="flex flex-col gap-4 px-6 pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            Daftar Surat Jalan & Ritase
          </CardTitle>
          <CardDescription className="text-xs">
            Data operasional pengangkutan semen curah hi-blow real-time
          </CardDescription>
        </div>

        {/* Filters and Counters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Truck Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Armada:
            </span>
            <Select
              value={currentTruckId}
              onValueChange={(val) => val && updateQuery("truckId", val)}
            >
              <SelectTrigger className="h-8 w-34 text-xs">
                <SelectValue placeholder="Semua Armada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Armada</SelectItem>
                <SelectItem value="W8187UA">W 8187 UA (Dutro)</SelectItem>
                <SelectItem value="H8133OF">H 8133 OF (Hino 500)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Bulan:
            </span>
            <Select
              value={currentMonth}
              onValueChange={(val) => val && updateQuery("month", val)}
            >
              <SelectTrigger className="h-8 w-30 text-xs">
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
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Tahun:
            </span>
            <Select
              value={currentYear}
              onValueChange={(val) => val && updateQuery("year", val)}
            >
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue placeholder="Semua" />
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
              className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RiFilterOffLine className="size-3.5" />
              <span>Reset</span>
            </Button>
          )}

          {/* Export Data Button */}
          <TripsExportButton
            trips={trips}
            filter={{
              truckId: currentTruckId,
              month: currentMonth,
              year: currentYear,
            }}
          />

          {/* Status Loading indicator */}
          <div className="hidden pl-2 text-xs text-muted-foreground md:block">
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
      </CardHeader>

      {/* Table Section */}
      <CardContent className="px-6 pb-4">
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs hover:bg-muted/50">
                <TableHead className="w-28 py-3 font-semibold text-foreground">
                  No. Surat Jalan
                </TableHead>
                <TableHead className="w-30 py-3 font-semibold text-foreground">
                  Armada
                </TableHead>
                <TableHead className="w-28 py-3 font-semibold text-foreground">
                  Tgl Order
                </TableHead>
                <TableHead className="w-28 py-3 font-semibold text-foreground">
                  Tgl Bongkar
                </TableHead>
                <TableHead className="py-3 font-semibold text-foreground">
                  Kota & Pabrik Tujuan
                </TableHead>
                <TableHead className="py-3 text-right font-semibold text-foreground">
                  Tarif / Ton
                </TableHead>
                <TableHead className="py-3 text-right font-semibold text-foreground">
                  Muatan
                </TableHead>
                <TableHead className="py-3 text-right font-semibold text-foreground">
                  Omset Bruto
                </TableHead>
                <TableHead className="py-3 text-right font-semibold text-foreground">
                  Sangu Supir
                </TableHead>
                <TableHead className="py-3 text-right font-semibold text-foreground">
                  Laba Ritase
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-36 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <RiTruckLine className="size-8 stroke-[1.5]" />
                      <p className="text-sm font-medium">
                        Tidak ada data ritase
                      </p>
                      <p className="text-xs">
                        Tidak ditemukan ritase yang cocok dengan filter yang
                        dipilih.
                      </p>
                      {hasActiveFilter && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetFilters}
                          className="mt-1 h-8 text-xs"
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
                      className="text-xs transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="font-mono font-medium">
                        #{trip.orderNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            trip.truckId === "W8187UA"
                              ? "border-primary/40 bg-primary/10 font-mono text-[11px] font-semibold text-primary"
                              : "border-amber-500/40 bg-amber-500/10 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                          }
                        >
                          {formatPlateNumber(trip.truckId)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDateIndonesian(trip.orderDate, true)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {trip.unloadingDate
                          ? formatDateIndonesian(trip.unloadingDate, true)
                          : "-"}
                      </TableCell>
                      <TableCell className="max-w-56">
                        <div className="truncate font-medium text-foreground">
                          {trip.destinationCity}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {trip.destinationName}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground tabular-nums">
                        {formatCurrency(rateNum)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium whitespace-nowrap tabular-nums">
                        {tonnageNum.toFixed(2)} ton
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-emerald-600 tabular-nums dark:text-emerald-400">
                        {formatCurrency(omsetNum)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-foreground tabular-nums">
                        {formatCurrency(sanguNum)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-foreground tabular-nums">
                        {formatCurrency(profitNum)}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Pagination Controls in CardFooter */}
      {trips.length > 0 && (
        <CardFooter className="flex flex-col items-center justify-between gap-3 border-t border-border px-6 py-4 text-xs text-muted-foreground sm:flex-row">
          <div>
            Menampilkan <strong>{startIndex + 1}</strong> s/d{" "}
            <strong>{endIndex}</strong> dari <strong>{trips.length}</strong>{" "}
            ritase
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1 px-2.5 text-xs shadow-none"
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
              className="h-8 gap-1 px-2.5 text-xs shadow-none"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <span>Berikutnya</span>
              <RiArrowRightSLine className="size-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
