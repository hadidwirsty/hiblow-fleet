"use client"

import { useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiEditLine,
  RiFilterOffLine,
  RiTruckLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TripFeeStatusDialog } from "@/features/trips/trip-fee-status-dialog"
import { TripsExportButton } from "@/features/trips/trips-export-button"
import { TripMobileCard } from "@/features/trips/trip-mobile-card"
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

  // Quick edit modal state for third party fee
  const [editingFeeTrip, setEditingFeeTrip] = useState<TripRecord | null>(null)
  const [feeFilter, setFeeFilter] = useState<"ALL" | "PENDING" | "PAID">("ALL")

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
    currentTruckId !== "ALL" ||
    currentMonth !== "ALL" ||
    currentYear !== "ALL" ||
    feeFilter !== "ALL"

  // Filter trips based on DO fee status in addition to server filters
  const filteredTrips = trips.filter((t) => {
    if (feeFilter === "ALL") return true
    const fee = parseFloat(t.thirdPartyFee || "0")
    const hasFee = fee > 0 || Boolean(t.thirdPartyName)
    const status = t.thirdPartyStatus?.toLowerCase() || ""
    const isPaid =
      status.includes("lunas") ||
      status.includes("sudah dibayar") ||
      status.includes("sdh dibayar")

    if (feeFilter === "PENDING") {
      return hasFee && !isPaid
    }
    if (feeFilter === "PAID") {
      return hasFee && isPaid
    }
    return true
  })

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
    setFeeFilter("ALL")
    setCurrentPage(1)
    startTransition(() => {
      router.push(pathname)
    })
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredTrips.length / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredTrips.length)
  const paginatedTrips = filteredTrips.slice(startIndex, endIndex)

  return (
    <Card className="border border-border shadow-xs">
      <CardHeader className="space-y-3 p-4 sm:p-6">
        <div>
          <CardTitle className="text-base font-semibold">
            Daftar Surat Jalan & Ritase
          </CardTitle>
          <CardDescription className="text-xs">
            Data operasional pengangkutan semen curah hi-blow real-time
          </CardDescription>
        </div>

        {/* Filters and Counters */}
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
              <SelectTrigger className="h-8 w-full text-xs sm:w-24">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fee DO Status Filter */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
              Status DO:
            </span>
            <Select
              value={feeFilter}
              onValueChange={(val) => {
                setFeeFilter(val as "ALL" | "PENDING" | "PAID")
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="h-8 w-full text-xs sm:w-34">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status DO</SelectItem>
                <SelectItem value="PENDING">Perlu Bayar (Pending)</SelectItem>
                <SelectItem value="PAID">Sudah Lunas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons: Reset & Export */}
          <div className="col-span-2 flex flex-wrap items-center gap-2 sm:col-auto">
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

            <TripsExportButton
              trips={trips}
              filter={{
                truckId: currentTruckId,
                month: currentMonth,
                year: currentYear,
              }}
            />
          </div>

          {/* Status Loading indicator */}
          <div className="col-span-2 text-xs text-muted-foreground sm:col-auto sm:pl-2">
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

      {/* Table & Mobile Cards Section */}
      <CardContent className="p-4 sm:px-6 sm:pb-4">
        {/* Mobile View: Cards */}
        <div className="block space-y-3 md:hidden">
          {paginatedTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-6 text-center text-muted-foreground">
              <RiTruckLine className="size-8 stroke-[1.5]" />
              <p className="text-sm font-medium">Tidak ada data ritase</p>
              <p className="text-xs">
                Tidak ditemukan ritase yang cocok dengan filter yang dipilih.
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
          ) : (
            paginatedTrips.map((trip) => (
              <TripMobileCard
                key={trip.id}
                trip={trip}
                onEditFee={setEditingFeeTrip}
              />
            ))
          )}
        </div>

        {/* Desktop View: 11-column Tabular Table */}
        <div className="hidden overflow-hidden rounded-lg border border-border md:block">
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
                <TableHead className="py-3 font-semibold text-foreground">
                  Fee DO & Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrips.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="h-36 text-center">
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
                      <TableCell className="max-w-44">
                        {parseFloat(trip.thirdPartyFee || "0") > 0 ||
                        trip.thirdPartyName ? (
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-1 font-mono text-[11px] font-semibold text-foreground">
                              <span>
                                {formatCurrency(
                                  parseFloat(trip.thirdPartyFee || "0")
                                )}
                              </span>
                              {trip.thirdPartyName && (
                                <span className="max-w-24 truncate text-[10px] text-muted-foreground">
                                  ({trip.thirdPartyName})
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditingFeeTrip(trip)}
                              className="group flex cursor-pointer items-center gap-1 text-left transition-opacity hover:opacity-80"
                              title="Klik untuk ubah status pembayaran"
                            >
                              <Badge
                                variant="outline"
                                className={`px-1.5 py-0 text-[10px] font-normal ${
                                  trip.thirdPartyStatus
                                    ?.toLowerCase()
                                    .includes("lunas") ||
                                  trip.thirdPartyStatus
                                    ?.toLowerCase()
                                    .includes("sudah dibayar") ||
                                  trip.thirdPartyStatus
                                    ?.toLowerCase()
                                    .includes("sdh dibayar")
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {trip.thirdPartyStatus || "Belum Dibayar"}
                              </Badge>
                              <RiEditLine className="size-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
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

      {/* Quick Edit Fee Modal */}
      <TripFeeStatusDialog
        trip={editingFeeTrip}
        open={Boolean(editingFeeTrip)}
        onOpenChange={(open) => {
          if (!open) setEditingFeeTrip(null)
        }}
      />
    </Card>
  )
}
