"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFilterLine,
  RiMoreLine,
  RiSearchLine,
  RiTruckLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import type { RateReference, trips } from "@/db/schema"
import { deleteTrip } from "@/features/trips/trips.actions"
import { TripFormDialog } from "@/features/trips/trip-form-dialog"
import { TripMobileCard } from "@/features/trips/trip-mobile-card"
import { filterTrips, isDoFeePaid } from "@/features/trips/trips.filter"
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"

export type TripRecord = typeof trips.$inferSelect

interface TripsTableProps {
  trips: TripRecord[]
  rateReferences?: RateReference[]
  initialFilter?: {
    truckId?: string
    month?: number
    year?: number
  }
}

function formatPlateNumber(truckId: string): string {
  if (truckId === "W8187UA") return "W 8187 UA"
  if (truckId === "H8133OF") return "H 8133 OF"
  return truckId
}

function getDriverAndTruck(truckId: string): { driver: string; plate: string } {
  if (truckId === "W8187UA") return { driver: "Triyono", plate: "W 8187 UA" }
  if (truckId === "H8133OF") return { driver: "Khoirul", plate: "H 8133 OF" }
  return { driver: "Supir", plate: truckId }
}

function formatDateRangeLabel(range?: DateRange): string {
  if (!range?.from) return "Pilih Tanggal"
  if (!range.to) return format(range.from, "d MMM yyyy", { locale: id })

  const fromMonth = range.from.getMonth()
  const toMonth = range.to.getMonth()
  const fromYear = range.from.getFullYear()
  const toYear = range.to.getFullYear()

  if (fromYear === toYear && fromMonth === toMonth) {
    if (range.from.getDate() === range.to.getDate()) {
      return format(range.from, "d MMM yyyy", { locale: id })
    }
    return `${format(range.from, "d", { locale: id })} - ${format(range.to, "d MMM yyyy", { locale: id })}`
  }

  if (fromYear === toYear) {
    return `${format(range.from, "d MMM", { locale: id })} - ${format(range.to, "d MMM yyyy", { locale: id })}`
  }

  return `${format(range.from, "d MMM yyyy", { locale: id })} - ${format(range.to, "d MMM yyyy", { locale: id })}`
}

export function TripsTable({
  trips,
  rateReferences = [],
  initialFilter,
}: TripsTableProps) {
  const rateMap = useMemo(
    () => new Map(rateReferences.map((r) => [r.id, r])),
    [rateReferences]
  )
  // Search & Filter state
  const [search, setSearch] = useState("")
  const [selectedTruck, setSelectedTruck] = useState<string>(
    initialFilter?.truckId ?? "ALL"
  )
  const [selectedDateRange, setSelectedDateRange] = useState<
    DateRange | undefined
  >(undefined)
  const [feeFilter, setFeeFilter] = useState<"ALL" | "PENDING" | "PAID">("ALL")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog state
  const [editingTrip, setEditingTrip] = useState<TripRecord | null>(null)
  const [deletingTrip, setDeletingTrip] = useState<TripRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleDeleteTrip = async () => {
    if (!deletingTrip) return
    setIsDeleting(true)
    try {
      const res = await deleteTrip(deletingTrip.id)
      if (res.success) {
        toast.success("Surat jalan ritase berhasil dihapus!")
        setDeletingTrip(null)
      } else {
        toast.error(res.error || "Gagal menghapus ritase.")
      }
    } catch {
      toast.error("Terjadi kendala jaringan saat menghapus ritase.")
    } finally {
      setIsDeleting(false)
    }
  }

  const isFiltered =
    Boolean(search.trim()) ||
    selectedTruck !== "ALL" ||
    Boolean(selectedDateRange?.from) ||
    feeFilter !== "ALL"

  const handleResetFilters = () => {
    setSearch("")
    setSelectedTruck("ALL")
    setSelectedDateRange(undefined)
    setFeeFilter("ALL")
    setCurrentPage(1)
  }

  // Filtered dataset
  const filteredTrips = useMemo(() => {
    const startDate = selectedDateRange?.from
      ? format(selectedDateRange.from, "yyyy-MM-dd")
      : undefined
    const endDate = selectedDateRange?.to
      ? format(selectedDateRange.to, "yyyy-MM-dd")
      : undefined

    return filterTrips(trips, {
      search,
      truckId: selectedTruck,
      startDate,
      endDate,
      feeFilter,
    })
  }, [trips, search, selectedTruck, selectedDateRange, feeFilter])

  // Paginated dataset
  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / pageSize))
  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTrips.slice(start, start + pageSize)
  }, [filteredTrips, currentPage, pageSize])

  const startIndex =
    filteredTrips.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, filteredTrips.length)

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar Terpadu */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* Search Bar Instan (Tinggi h-10 setara pembungkus filter) */}
        <div className="relative w-full xl:max-w-md">
          <RiSearchLine className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Cari nomor surat jalan atau kota tujuan..."
            className="h-10 w-full rounded-xl border-border/70 bg-card/60 pl-9.5 text-xs shadow-2xs focus-visible:ring-1"
          />
        </div>

        {/* Filter Group: Kapsul Terpadu Responsif (Tinggi h-10 di tablet & desktop) */}
        <div className="flex w-full items-center xl:w-auto">
          <div className="flex w-full flex-col gap-2 rounded-xl border border-border/80 bg-muted/40 p-2.5 shadow-2xs sm:h-10 sm:w-full sm:flex-row sm:items-center sm:gap-2 sm:px-2 sm:py-0 xl:h-10 xl:w-auto xl:gap-2 xl:px-2">
            {/* Header Filter di Mobile */}
            <div className="flex items-center justify-between px-0.5 text-xs font-semibold text-muted-foreground sm:hidden">
              <span className="flex items-center gap-1.5">
                <RiFilterLine className="size-3.5 text-primary" />
                <span>Filter Data:</span>
              </span>
              {isFiltered && (
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

            {/* 1. Filter Armada (Nama Supir - Nomor Kendaraan) */}
            <Select
              value={selectedTruck}
              onValueChange={(val) => {
                if (val) {
                  setSelectedTruck(val)
                  setCurrentPage(1)
                }
              }}
            >
              <SelectTrigger className="h-8.5 w-full rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-7.5 sm:min-w-0 sm:flex-1 xl:w-48 xl:flex-none">
                <SelectValue>
                  {selectedTruck === "ALL"
                    ? "Semua Armada"
                    : selectedTruck === "W8187UA"
                      ? "Triyono - W 8187 UA"
                      : "Khoirul - H 8133 OF"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-medium">
                  Semua Armada
                </SelectItem>
                <SelectItem value="W8187UA" className="text-xs">
                  Triyono - W 8187 UA
                </SelectItem>
                <SelectItem value="H8133OF" className="text-xs">
                  Khoirul - H 8133 OF
                </SelectItem>
              </SelectContent>
            </Select>

            {/* 2. Filter Status Biaya DO */}
            <Select
              value={feeFilter}
              onValueChange={(val) => {
                if (val) {
                  setFeeFilter(val as "ALL" | "PENDING" | "PAID")
                  setCurrentPage(1)
                }
              }}
            >
              <SelectTrigger className="h-8.5 w-full rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-7.5 sm:min-w-0 sm:flex-1 xl:w-40 xl:flex-none">
                <SelectValue>
                  {feeFilter === "ALL"
                    ? "Semua Status DO"
                    : feeFilter === "PENDING"
                      ? "Perlu Bayar"
                      : "Sudah Lunas"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-medium">
                  Semua Status DO
                </SelectItem>
                <SelectItem value="PENDING" className="text-xs">
                  Perlu Bayar (Pending)
                </SelectItem>
                <SelectItem value="PAID" className="text-xs">
                  Sudah Lunas
                </SelectItem>
              </SelectContent>
            </Select>

            {/* 3. Filter Tanggal Kalender (Range Picker tanpa ikon kalender) */}
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-full justify-between rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-8 sm:min-w-0 sm:flex-1 xl:w-48 xl:flex-none"
                  >
                    <span className="truncate">
                      {formatDateRangeLabel(selectedDateRange)}
                    </span>
                    <RiArrowDownSLine className="size-4 shrink-0 text-muted-foreground" />
                  </Button>
                }
              />
              <PopoverContent align="center" className="w-auto p-0">
                <Calendar
                  mode="range"
                  defaultMonth={selectedDateRange?.from}
                  selected={selectedDateRange}
                  onSelect={(range) => {
                    setSelectedDateRange(range)
                    setCurrentPage(1)
                  }}
                  numberOfMonths={1}
                  locale={id}
                />
              </PopoverContent>
            </Popover>

            {/* Reset Button di Tablet & Desktop */}
            {isFiltered && (
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
      </div>

      {/* Mobile Cards View (< md) */}
      <div className="block space-y-3 md:hidden">
        {paginatedTrips.length === 0 ? (
          <Empty className="rounded-xl border border-dashed border-border/80 bg-card/60 py-12">
            <EmptyMedia
              variant="icon"
              className="size-11 rounded-xl bg-primary/10 text-primary"
            >
              {isFiltered ? (
                <RiSearchLine className="size-5 text-primary" />
              ) : (
                <RiTruckLine className="size-5 text-primary" />
              )}
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {isFiltered
                  ? "Tidak Ada Ritase yang Cocok"
                  : "Belum Ada Surat Jalan"}
              </EmptyTitle>
              <EmptyDescription>
                {isFiltered
                  ? "Tidak ada data surat jalan yang sesuai dengan pencarian atau filter aktif Anda."
                  : "Daftar pencatatan ritase semen curah masih kosong. Mulai catat surat jalan pertama Anda."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="mt-3 w-full max-w-xs">
              {isFiltered ? (
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleResetFilters}
                  className="h-10 gap-2 px-5 text-sm font-medium shadow-xs"
                >
                  <RiCloseLine className="size-4" />
                  <span>Reset Filter</span>
                </Button>
              ) : (
                <Button
                  size="default"
                  onClick={() => setIsCreateOpen(true)}
                  className="h-10 gap-2 px-6 text-sm font-medium shadow-xs transition-all hover:shadow-sm"
                >
                  <RiAddLine className="size-4.5" />
                  <span>Tambah Ritase Baru</span>
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          paginatedTrips.map((trip) => {
            const originPlant =
              rateMap.get(trip.rateReferenceId ?? "")?.originPlant || "-"
            return (
              <TripMobileCard
                key={trip.id}
                trip={trip}
                originPlant={originPlant}
                onEdit={setEditingTrip}
                onDelete={setDeletingTrip}
              />
            )
          })
        )}
      </div>

      {/* Desktop Table Container (>= md) */}
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-xs md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="min-w-36 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  No. Surat Jalan
                </TableHead>
                <TableHead className="min-w-32 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Supir - Armada
                </TableHead>
                <TableHead className="min-w-44 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Pabrik Asal
                </TableHead>
                <TableHead className="min-w-48 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Kota & Pabrik Tujuan
                </TableHead>
                <TableHead className="min-w-32 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Tonase Muatan (Ton)
                </TableHead>
                <TableHead className="min-w-28 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Tarif / Ton
                </TableHead>
                <TableHead className="min-w-36 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Sangu Supir / Uang Jalan
                </TableHead>
                <TableHead className="min-w-28 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Tgl Order
                </TableHead>
                <TableHead className="min-w-32 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Tonase Bongkar (Ton)
                </TableHead>
                <TableHead className="min-w-28 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Tgl Bongkar
                </TableHead>
                <TableHead className="min-w-32 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Omset Bruto
                </TableHead>
                <TableHead className="min-w-32 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Laba Bersih
                </TableHead>
                <TableHead className="min-w-56 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Biaya DO Pihak Ke-3
                </TableHead>
                <TableHead className="w-16 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrips.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={14} className="p-0">
                    <Empty className="w-full border-0 py-20 sm:py-24 md:py-28 lg:py-32">
                      <EmptyMedia
                        variant="icon"
                        className="mb-3 size-12 rounded-2xl bg-primary/10 text-primary md:size-14"
                      >
                        {isFiltered ? (
                          <RiSearchLine className="size-6 text-primary md:size-7" />
                        ) : (
                          <RiTruckLine className="size-6 text-primary md:size-7" />
                        )}
                      </EmptyMedia>
                      <EmptyHeader className="max-w-md gap-2.5 sm:max-w-lg md:max-w-xl lg:max-w-2xl">
                        <EmptyTitle className="text-base font-semibold sm:text-lg md:text-xl">
                          {isFiltered
                            ? "Tidak Ada Ritase yang Cocok"
                            : "Belum Ada Surat Jalan"}
                        </EmptyTitle>
                        <EmptyDescription className="text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base">
                          {isFiltered
                            ? "Tidak ada data ritase surat jalan yang sesuai dengan kata kunci pencarian atau kombinasi filter aktif Anda. Silakan ubah kata kunci atau klik tombol reset filter di bawah."
                            : "Daftar pencatatan ritase operasional saat ini masih kosong. Mulai tambahkan surat jalan pengiriman pertama Anda."}
                        </EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent className="mt-3 w-full max-w-xs sm:max-w-sm md:max-w-md">
                        {isFiltered ? (
                          <Button
                            variant="outline"
                            size="default"
                            onClick={handleResetFilters}
                            className="h-10 gap-2 px-5 text-sm font-medium shadow-xs"
                          >
                            <RiCloseLine className="size-4" />
                            <span>Reset Filter</span>
                          </Button>
                        ) : (
                          <Button
                            size="default"
                            onClick={() => setIsCreateOpen(true)}
                            className="h-10 gap-2 px-6 text-sm font-medium shadow-xs transition-all hover:shadow-sm"
                          >
                            <RiAddLine className="size-4.5" />
                            <span>Tambah Ritase Baru</span>
                          </Button>
                        )}
                      </EmptyContent>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTrips.map((trip) => {
                  const isPaid = isDoFeePaid(trip.thirdPartyStatus)
                  const hasFee =
                    parseFloat(trip.thirdPartyFee || "0") > 0 ||
                    Boolean(trip.thirdPartyName)
                  const driverInfo = getDriverAndTruck(trip.truckId)
                  const rateRef = rateMap.get(trip.rateReferenceId ?? "")
                  const originPlant = rateRef?.originPlant || "-"

                  return (
                    <TableRow
                      key={trip.id}
                      className="text-xs hover:bg-muted/30"
                    >
                      {/* 1. No. Surat Jalan */}
                      <TableCell className="text-left font-mono font-bold whitespace-nowrap text-foreground">
                        {trip.orderNumber.startsWith("#")
                          ? trip.orderNumber
                          : `#${trip.orderNumber}`}
                      </TableCell>

                      {/* 2. Supir - Armada */}
                      <TableCell className="text-left whitespace-nowrap">
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="font-semibold text-foreground">
                            {driverInfo.driver}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              trip.truckId === "W8187UA"
                                ? "border-primary/40 bg-primary/10 font-mono text-[11px] font-semibold text-primary"
                                : "border-amber-500/40 bg-amber-500/10 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                            }
                          >
                            {driverInfo.plate}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* 3. Pabrik Asal */}
                      <TableCell className="text-left whitespace-nowrap text-muted-foreground">
                        {originPlant}
                      </TableCell>

                      {/* 4. Kota & Pabrik Tujuan */}
                      <TableCell className="text-left whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {trip.destinationCity}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {trip.destinationName}
                          </span>
                        </div>
                      </TableCell>

                      {/* 5. Tonase Muatan (Ton) */}
                      <TableCell className="text-left font-mono font-medium whitespace-nowrap text-foreground">
                        {trip.loadedTonnage
                          ? parseFloat(trip.loadedTonnage).toFixed(2)
                          : "31.00"}
                      </TableCell>

                      {/* 6. Tarif / Ton */}
                      <TableCell className="text-left font-mono whitespace-nowrap text-muted-foreground">
                        {formatCurrency(parseFloat(trip.ratePerTon))}
                      </TableCell>

                      {/* 7. Sangu Supir / Uang Jalan */}
                      <TableCell className="text-left font-mono whitespace-nowrap text-muted-foreground">
                        {formatCurrency(parseFloat(trip.sangu))}
                      </TableCell>

                      {/* 8. Tgl Order */}
                      <TableCell className="text-left whitespace-nowrap text-muted-foreground">
                        {formatDateIndonesian(trip.orderDate, true)}
                      </TableCell>

                      {/* 9. Tonase Bongkar (Ton) */}
                      <TableCell className="text-left font-mono font-medium whitespace-nowrap text-foreground">
                        {trip.unloadingDate &&
                        parseFloat(trip.unloadedTonnage) > 0
                          ? parseFloat(trip.unloadedTonnage).toFixed(2)
                          : "-"}
                      </TableCell>

                      {/* 10. Tgl Bongkar */}
                      <TableCell className="text-left whitespace-nowrap text-muted-foreground">
                        {trip.unloadingDate
                          ? formatDateIndonesian(trip.unloadingDate, true)
                          : "-"}
                      </TableCell>

                      {/* 11. Omset Bruto */}
                      <TableCell className="text-left font-mono font-semibold whitespace-nowrap text-foreground">
                        {formatCurrency(parseFloat(trip.omset))}
                      </TableCell>

                      {/* 12. Laba Bersih */}
                      <TableCell className="text-left font-mono font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(parseFloat(trip.profit))}
                      </TableCell>

                      {/* 13. Biaya DO Pihak Ke-3 */}
                      <TableCell className="text-left whitespace-nowrap">
                        {hasFee ? (
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-foreground">
                              <span>
                                {formatCurrency(
                                  parseFloat(trip.thirdPartyFee || "0")
                                )}
                              </span>
                              {trip.thirdPartyName && (
                                <span className="font-sans text-[11px] font-normal text-muted-foreground">
                                  ({trip.thirdPartyName})
                                </span>
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className={`px-1.5 py-0 text-[10px] font-normal ${
                                isPaid
                                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}
                            >
                              {trip.thirdPartyStatus || "Belum Bayar"}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      {/* 14. Aksi */}
                      <TableCell className="text-left whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                              >
                                <RiMoreLine className="size-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-xs">
                                Aksi Ritase
                              </DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-xs"
                                onClick={() => setEditingTrip(trip)}
                              >
                                <RiEditLine className="size-3.5" />
                                <span>Edit Ritase</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                                onClick={() => setDeletingTrip(trip)}
                              >
                                <RiDeleteBinLine className="size-3.5" />
                                <span>Hapus Ritase</span>
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
      </div>

      {/* Pagination Footer (Mobile & Desktop) */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border bg-card p-3 text-xs text-muted-foreground shadow-xs sm:flex-row sm:px-4">
        <div>
          Menampilkan <strong>{startIndex}</strong> -{" "}
          <strong>{endIndex}</strong> dari{" "}
          <strong>{filteredTrips.length}</strong> ritase
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

      {/* Edit Dialog Modal */}
      {editingTrip && (
        <TripFormDialog
          mode="edit"
          trip={editingTrip}
          rateReferences={rateReferences}
          open={!!editingTrip}
          onOpenChange={(isOpen) => !isOpen && setEditingTrip(null)}
          showTrigger={false}
        />
      )}

      {/* Confirm Delete Dialog (Redesigned matching standard warning modal) */}
      <Dialog
        open={!!deletingTrip}
        onOpenChange={(isOpen) => !isOpen && setDeletingTrip(null)}
      >
        <DialogContent className="p-6 sm:max-w-md">
          <div className="flex flex-col items-center text-center">
            {/* Lingkaran Kuning / Amber Besar dengan Tanda Seru */}
            <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-amber-500 shadow-md">
              <span className="font-sans text-3xl leading-none font-extrabold text-white">
                !
              </span>
            </div>

            <DialogHeader className="items-center space-y-2 text-center">
              <DialogTitle className="text-lg font-bold text-foreground">
                Konfirmasi Hapus Surat Jalan
              </DialogTitle>
              <DialogDescription className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                Apakah Anda yakin ingin menghapus surat jalan order{" "}
                <strong className="text-foreground">
                  #{deletingTrip?.orderNumber}
                </strong>{" "}
                (
                {deletingTrip
                  ? `${getDriverAndTruck(deletingTrip.truckId).driver} - ${formatPlateNumber(deletingTrip.truckId)}`
                  : ""}
                ) tujuan{" "}
                <strong className="text-foreground">
                  {deletingTrip?.destinationCity}
                </strong>
                ? Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>

            {/* 2 Tombol Sejajar Berdampingan */}
            <div className="mt-6 grid w-full grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-10 w-full rounded-xl border-border/80 text-xs font-medium hover:bg-muted"
                onClick={() => setDeletingTrip(null)}
                disabled={isDeleting}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-10 w-full rounded-xl text-xs font-semibold shadow-xs"
                onClick={handleDeleteTrip}
                disabled={isDeleting}
              >
                {isDeleting ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Tambah Ritase Baru dari Empty State */}
      <TripFormDialog
        rateReferences={rateReferences}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        showTrigger={false}
      />
    </div>
  )
}
