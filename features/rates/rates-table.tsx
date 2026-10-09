"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiFilterLine,
  RiPercentLine,
  RiRouteLine,
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
import {
  deleteRateReference,
  toggleRateReferenceStatus,
} from "@/features/rates/rates.actions"
import { RateDetailSheet } from "@/features/rates/rate-detail-sheet"
import { RateFormDialog } from "@/features/rates/rate-form-dialog"
import { RateMobileCard } from "@/features/rates/rate-mobile-card"
import {
  formatCityWithCode,
  formatCurrency,
  formatPercentage,
} from "@/lib/utils"
import { useUIStore } from "@/stores/theme"
import type { RateReference } from "@/db/schema"

interface RatesTableProps {
  rates: RateReference[]
  distinctClients: string[]
  distinctOriginPlants?: string[]
}

export function RatesTable({
  rates,
  distinctClients,
  distinctOriginPlants = [
    "Semen Indonesia (SI) - Tuban",
    "Semen Indonesia (SI) - Rembang",
    "Solusi Bangun Indonesia (SBI) - Tuban",
    "Indocement - Grobogan",
  ],
}: RatesTableProps) {
  const [search, setSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog action state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<RateReference | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedDetailRate, setSelectedDetailRate] =
    useState<RateReference | null>(null)

  // Timeout refs untuk pembatalan dan pembersihan timer transisi keluar modal
  const detailTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const editTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (detailTimeoutRef.current) clearTimeout(detailTimeoutRef.current)
      if (editTimeoutRef.current) clearTimeout(editTimeoutRef.current)
    }
  }, [])

  const handleOpenDetail = (rate: RateReference) => {
    if (detailTimeoutRef.current) {
      clearTimeout(detailTimeoutRef.current)
      detailTimeoutRef.current = null
    }
    setSelectedDetailRate(rate)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = (isOpen: boolean) => {
    setIsDetailOpen(isOpen)
    if (!isOpen) {
      if (detailTimeoutRef.current) {
        clearTimeout(detailTimeoutRef.current)
      }
      detailTimeoutRef.current = setTimeout(() => {
        setSelectedDetailRate(null)
        detailTimeoutRef.current = null
      }, 350)
    }
  }

  const handleOpenEdit = (rate: RateReference) => {
    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current)
      editTimeoutRef.current = null
    }
    setEditingRate(rate)
    setIsEditOpen(true)
  }

  const handleCloseEdit = (isOpen: boolean) => {
    setIsEditOpen(isOpen)
    if (!isOpen) {
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current)
      }
      editTimeoutRef.current = setTimeout(() => {
        setEditingRate(null)
        editTimeoutRef.current = null
      }, 350)
    }
  }

  const isFiltered =
    Boolean(search.trim()) ||
    selectedClient !== "ALL" ||
    selectedStatus !== "ALL"

  const handleResetFilters = () => {
    setSearch("")
    setSelectedClient("ALL")
    setSelectedStatus("ALL")
    setCurrentPage(1)
  }

  const filterPlantOptions = useMemo(() => {
    const list =
      distinctOriginPlants && distinctOriginPlants.length > 0
        ? distinctOriginPlants
        : distinctClients
    return Array.from(new Set(list))
  }, [distinctOriginPlants, distinctClients])

  // Filtered dataset
  const filteredRates = useMemo(() => {
    return rates.filter((rate) => {
      // 1. Search filter: Hanya kota tujuan (termasuk kode) dan tujuan bongkar (pabrik telah tercakup pada filter dropdown)
      if (search.trim()) {
        const query = search.toLowerCase()
        const fullCity = formatCityWithCode(
          rate.city,
          rate.cityCode
        ).toLowerCase()
        const matchCity = fullCity.includes(query)
        const matchDest = rate.destination.toLowerCase().includes(query)
        if (!matchCity && !matchDest) return false
      }

      // 2. Client / Origin Plant filter
      if (
        selectedClient !== "ALL" &&
        rate.clientName !== selectedClient &&
        rate.originPlant !== selectedClient
      ) {
        return false
      }

      // 3. Status filter
      if (selectedStatus === "ACTIVE" && !rate.isActive) return false
      if (selectedStatus === "INACTIVE" && rate.isActive) return false

      return true
    })
  }, [rates, search, selectedClient, selectedStatus])

  // Paginated dataset
  const totalPages = Math.max(1, Math.ceil(filteredRates.length / pageSize))
  const paginatedRates = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRates.slice(start, start + pageSize)
  }, [filteredRates, currentPage, pageSize])

  const startIndex =
    filteredRates.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, filteredRates.length)

  const { setModalDelete, setModalInactive, setModalSuccess } = useUIStore()

  const handleToggleStatus = (rate: RateReference) => {
    if (rate.isActive) {
      setModalInactive({
        open: true,
        title: "Nonaktifkan Referensi Rute?",
        message: `Apakah Anda yakin ingin menonaktifkan rute tujuan "${rate.destination}" di kota ${formatCityWithCode(rate.city, rate.cityCode)}? Rute ini tidak akan muncul pada pilihan pencatatan ritase baru.`,
        actionMessage: "Nonaktifkan",
        action: async () => {
          try {
            const res = await toggleRateReferenceStatus(rate.id, false)
            if (res.success) {
              setModalSuccess({
                open: true,
                title: "Rute Dinonaktifkan",
                message: `Referensi rute ${rate.destination} telah dinonaktifkan.`,
                actionMessage: "Selesai",
              })
            } else {
              toast.error(res.error || "Gagal menonaktifkan rute")
            }
          } catch {
            toast.error("Gagal mengubah status rute")
          }
        },
      })
      return
    }

    // Aktifkan kembali rute yang sedang tidak aktif
    void (async () => {
      try {
        const res = await toggleRateReferenceStatus(rate.id, true)
        if (res.success) {
          setModalSuccess({
            open: true,
            title: "Rute Diaktifkan Kembali",
            message: `Referensi rute ${rate.destination} kini aktif dan dapat digunakan kembali.`,
            actionMessage: "Selesai",
          })
        } else {
          toast.error(res.error || "Gagal mengaktifkan rute")
        }
      } catch {
        toast.error("Gagal mengubah status rute")
      }
    })()
  }

  const promptDeleteRate = (rate: RateReference) => {
    setModalDelete({
      open: true,
      title: "Hapus Referensi Rute",
      message: `Apakah Anda yakin ingin menghapus rute tujuan "${rate.destination}" (${formatCityWithCode(rate.city, rate.cityCode)})? Tindakan ini tidak dapat dibatalkan.`,
      action: async () => {
        const res = await deleteRateReference(rate.id)
        if (res.success) {
          setModalSuccess({
            open: true,
            title: "Rute Berhasil Dihapus",
            message: `Referensi rute ${rate.destination} telah dihapus dari sistem.`,
            actionMessage: "Tutup",
          })
        } else {
          toast.error(res.error || "Gagal menghapus rute")
        }
      },
    })
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Search & Filter Toolbar Terpadu */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* Search Bar Instan (Tinggi h-10 setara pembungkus filter) */}
        <div className="relative w-full xl:max-w-md xl:shrink-0">
          <RiSearchLine className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Cari kota tujuan atau tujuan bongkar..."
            className="h-10 w-full rounded-xl border-border/70 bg-card/60 pl-9.5 text-xs shadow-2xs focus-visible:ring-1"
          />
        </div>

        {/* Filter Group: Kapsul Terpadu Responsif (Tinggi h-10 di tablet & desktop) */}
        <div className="flex w-full flex-col gap-2 rounded-xl border border-border/80 bg-muted/40 p-2.5 shadow-2xs sm:h-10 sm:w-full sm:flex-row sm:items-center sm:gap-2 sm:px-2 sm:py-0 xl:h-10 xl:w-auto xl:shrink-0">
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

          {/* 1. Filter Pabrik */}
          <Select
            value={selectedClient}
            onValueChange={(val) => {
              if (val) {
                setSelectedClient(val)
                setCurrentPage(1)
              }
            }}
          >
            <SelectTrigger className="h-8.5 w-full rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-7.5 sm:min-w-0 sm:flex-1 xl:w-56 xl:flex-none">
              <SelectValue>
                {selectedClient === "ALL" ? "Semua Pabrik" : selectedClient}
              </SelectValue>
            </SelectTrigger>
            <SelectContent
              align="start"
              alignItemWithTrigger={false}
              className="w-auto max-w-[calc(100vw-2rem)] min-w-56 sm:min-w-70"
            >
              <SelectItem value="ALL" className="text-xs font-medium">
                Semua Pabrik
              </SelectItem>
              {filterPlantOptions.map((plant) => (
                <SelectItem key={plant} value={plant} className="text-xs">
                  {plant}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 2. Filter Status */}
          <Select
            value={selectedStatus}
            onValueChange={(val) => {
              if (val) {
                setSelectedStatus(val)
                setCurrentPage(1)
              }
            }}
          >
            <SelectTrigger className="h-8.5 w-full rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:h-7.5 sm:min-w-0 sm:flex-1 xl:w-36 xl:flex-none">
              <SelectValue>
                {selectedStatus === "ALL"
                  ? "Semua Status"
                  : selectedStatus === "ACTIVE"
                    ? "Aktif"
                    : "Nonaktif"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              <SelectItem value="ALL" className="text-xs font-medium">
                Semua Status
              </SelectItem>
              <SelectItem value="ACTIVE" className="text-xs">
                Aktif
              </SelectItem>
              <SelectItem value="INACTIVE" className="text-xs">
                Nonaktif
              </SelectItem>
            </SelectContent>
          </Select>

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

      {/* Mobile Cards View (< md) */}
      <div className="block space-y-3 md:hidden">
        {paginatedRates.length === 0 ? (
          <Empty className="rounded-xl border border-dashed border-border/80 bg-card/60 py-12">
            <EmptyMedia
              variant="icon"
              className="size-11 rounded-xl bg-primary/10 text-primary"
            >
              {isFiltered ? (
                <RiSearchLine className="size-5 text-primary" />
              ) : (
                <RiRouteLine className="size-5 text-primary" />
              )}
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {isFiltered
                  ? "Tidak Ada Rute yang Cocok"
                  : "Belum Ada Referensi Tarif"}
              </EmptyTitle>
              <EmptyDescription>
                {isFiltered
                  ? "Tidak ada data rute tarif yang sesuai dengan pencarian atau filter aktif Anda."
                  : "Daftar referensi tarif pabrik masih kosong. Mulai daftarkan rute pertama Anda."}
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
                  <span>Tambah Tarif</span>
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          paginatedRates.map((rate) => (
            <RateMobileCard
              key={rate.id}
              rate={rate}
              onViewDetail={handleOpenDetail}
              onEdit={handleOpenEdit}
              onToggleStatus={handleToggleStatus}
              onDelete={promptDeleteRate}
            />
          ))
        )}
      </div>

      {/* Desktop Table Container (>= md) */}
      <div className="hidden w-full max-w-full min-w-0 overflow-hidden rounded-xl border bg-card shadow-xs md:block">
        <Table containerClassName="max-h-[calc(100vh-14rem)]">
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/95">
              <TableHead className="w-12 py-3 text-center text-xs font-semibold whitespace-nowrap text-foreground">
                No
              </TableHead>
              <TableHead className="min-w-44 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                Pabrik Asal
              </TableHead>
              <TableHead className="min-w-32 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                Kota Tujuan
              </TableHead>
              <TableHead className="min-w-48 py-3 text-left text-xs font-semibold whitespace-nowrap text-foreground">
                Tujuan Bongkar (Proyek / BP)
              </TableHead>
              <TableHead className="min-w-32 py-3 text-right text-xs font-semibold whitespace-nowrap text-foreground">
                Tarif OA / Ton
              </TableHead>
              <TableHead className="min-w-32 py-3 text-right text-xs font-semibold whitespace-nowrap text-foreground">
                Est. Jumlah
              </TableHead>
              <TableHead className="min-w-24 py-3 text-right text-xs font-semibold whitespace-nowrap text-foreground">
                % Sangu
              </TableHead>
              <TableHead className="min-w-32 py-3 text-right text-xs font-semibold whitespace-nowrap text-foreground">
                Sangu Supir
              </TableHead>
              <TableHead className="min-w-32 py-3 text-right text-xs font-semibold whitespace-nowrap text-foreground">
                Est. Profit
              </TableHead>
              <TableHead className="min-w-24 py-3 text-center text-xs font-semibold whitespace-nowrap text-foreground">
                Potongan
              </TableHead>
              <TableHead className="min-w-24 py-3 text-center text-xs font-semibold whitespace-nowrap text-foreground">
                Status
              </TableHead>
              <TableHead className="w-24 min-w-20 py-3 text-center text-xs font-semibold whitespace-nowrap text-foreground">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRates.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={12} className="p-0">
                  <Empty className="w-full border-0 py-20 sm:py-24 md:py-28 lg:py-32">
                    <EmptyMedia
                      variant="icon"
                      className="mb-3 size-12 rounded-2xl bg-primary/10 text-primary md:size-14"
                    >
                      {isFiltered ? (
                        <RiSearchLine className="size-6 text-primary md:size-7" />
                      ) : (
                        <RiRouteLine className="size-6 text-primary md:size-7" />
                      )}
                    </EmptyMedia>
                    <EmptyHeader className="max-w-md gap-2.5 sm:max-w-lg md:max-w-xl lg:max-w-2xl">
                      <EmptyTitle className="text-base font-semibold sm:text-lg md:text-xl">
                        {isFiltered
                          ? "Tidak Ada Rute yang Cocok"
                          : "Belum Ada Referensi Tarif"}
                      </EmptyTitle>
                      <EmptyDescription className="text-xs leading-relaxed text-muted-foreground sm:text-sm md:text-base">
                        {isFiltered
                          ? "Tidak ada referensi tarif yang sesuai dengan kata kunci pencarian atau kombinasi filter aktif Anda. Silakan ubah kata kunci atau klik tombol reset di bawah."
                          : "Daftar referensi tarif pabrik saat ini masih kosong. Mulai daftarkan rute baru beserta acuan tarif ongkos angkut (OA) dan uang jalan supir."}
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
                          <span>Tambah Tarif</span>
                        </Button>
                      )}
                    </EmptyContent>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRates.map((rate, idx) => {
                const numRate = parseFloat(rate.ratePerTon)
                const numPct = parseFloat(rate.sanguPercentage)
                const numTon = parseFloat(rate.standardTonnage || "31")
                const rowJumlah = rate.estimatedRevenue
                  ? parseFloat(rate.estimatedRevenue)
                  : Math.round(numRate * numTon)
                const formulaSangu = Math.round(rowJumlah * numPct)

                const parsedDefaultSangu = rate.defaultSangu
                  ? parseFloat(rate.defaultSangu)
                  : 0
                const isLegacyThousandRounding =
                  parsedDefaultSangu > 0 &&
                  formulaSangu > 0 &&
                  Math.abs(
                    parsedDefaultSangu - Math.round(formulaSangu / 1000) * 1000
                  ) === 0 &&
                  Math.abs(parsedDefaultSangu - formulaSangu) < 1000

                const rowSangu =
                  parsedDefaultSangu > 0 && !isLegacyThousandRounding
                    ? parsedDefaultSangu
                    : formulaSangu
                const rowProfit = rate.estimatedProfitTotal
                  ? parseFloat(rate.estimatedProfitTotal)
                  : rowJumlah - rowSangu
                const rowNumber = (currentPage - 1) * pageSize + idx + 1

                return (
                  <TableRow key={rate.id} className="text-xs hover:bg-muted/30">
                    <TableCell className="text-center font-mono whitespace-nowrap text-muted-foreground">
                      {rowNumber}
                    </TableCell>
                    <TableCell className="text-left whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/5 text-[11px] font-semibold text-primary"
                      >
                        {rate.originPlant || rate.clientName}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left whitespace-nowrap">
                      <div className="font-semibold text-foreground">
                        {formatCityWithCode(rate.city, rate.cityCode)}
                      </div>
                      {rate.zoneCode && (
                        <div className="font-mono text-[10px] text-muted-foreground">
                          Zone: {rate.zoneCode}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-left font-medium whitespace-nowrap text-foreground">
                      {rate.destination}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium whitespace-nowrap text-foreground">
                      {formatCurrency(numRate)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium whitespace-nowrap text-foreground">
                      {formatCurrency(rowJumlah)}
                    </TableCell>
                    <TableCell className="text-right font-mono whitespace-nowrap text-muted-foreground">
                      {formatPercentage(rate.sanguPercentage)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold whitespace-nowrap text-primary">
                      {formatCurrency(rowSangu)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold whitespace-nowrap ${
                        rowProfit > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : rowProfit < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                      }`}
                    >
                      {formatCurrency(rowProfit)}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      {rate.hasSpecialDeductions ? (
                        <Badge
                          variant="secondary"
                          className="bg-purple-500/10 text-[10px] text-purple-700 dark:text-purple-300"
                        >
                          <RiPercentLine className="mr-0.5 size-3" />
                          LJU
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <Badge
                        variant={rate.isActive ? "default" : "outline"}
                        className={`text-[10px] ${
                          rate.isActive
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "text-muted-foreground"
                        }`}
                      >
                        {rate.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
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
                              Aksi Rute
                            </DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs"
                              onClick={() => handleOpenDetail(rate)}
                            >
                              <RiEyeLine className="size-3.5 text-muted-foreground" />
                              <span>Lihat Detail</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs"
                              onClick={() => handleOpenEdit(rate)}
                            >
                              <RiEditLine className="size-3.5 text-muted-foreground" />
                              <span>Ubah Tarif</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs"
                              onClick={() => handleToggleStatus(rate)}
                            >
                              {rate.isActive ? (
                                <>
                                  <RiCloseLine className="size-3.5 text-amber-600 dark:text-amber-400" />
                                  <span>Nonaktifkan</span>
                                </>
                              ) : (
                                <>
                                  <RiCheckLine className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Aktifkan</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                              onClick={() => promptDeleteRate(rate)}
                            >
                              <RiDeleteBinLine className="size-3.5" />
                              <span>Hapus Rute</span>
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

      {/* Pagination Footer (Mobile & Desktop) */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border bg-card p-3 text-xs text-muted-foreground shadow-xs sm:flex-row sm:px-4">
        <div>
          Menampilkan <strong>{startIndex}</strong> -{" "}
          <strong>{endIndex}</strong> dari{" "}
          <strong>{filteredRates.length}</strong> rute
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

      {/* Create Dialog Modal dari Empty State */}
      <RateFormDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        distinctOriginPlants={distinctOriginPlants}
      />

      {/* Edit Dialog Modal: Selalu terpasang di DOM agar transisi buka (slide-up di mobile / zoom-fade di desktop) terpicu mulus sama persis dengan modal create */}
      <RateFormDialog
        mode="edit"
        rate={editingRate}
        open={isEditOpen}
        onOpenChange={handleCloseEdit}
        distinctOriginPlants={distinctOriginPlants}
      />

      {/* Sheet Rincian Detail Referensi Tarif Pabrik: animasi slide-in/slide-out penuh 300ms */}
      <RateDetailSheet
        rate={selectedDetailRate}
        open={isDetailOpen}
        onOpenChange={handleCloseDetail}
        onEdit={(r) => {
          setIsDetailOpen(false)
          handleOpenEdit(r)
        }}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  )
}
