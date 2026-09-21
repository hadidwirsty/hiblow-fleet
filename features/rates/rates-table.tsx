"use client"

import { useMemo, useState } from "react"
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFilterLine,
  RiMoreLine,
  RiPercentLine,
  RiRouteLine,
  RiSearchLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import type { RateReference } from "@/db/schema"
import {
  deleteRateReference,
  toggleRateReferenceStatus,
} from "@/features/rates/rates.actions"
import { RateFormDialog } from "@/features/rates/rate-form-dialog"
import { RateMobileCard } from "@/features/rates/rate-mobile-card"
import { formatCurrency } from "@/lib/utils"

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
  const [editingRate, setEditingRate] = useState<RateReference | null>(null)
  const [deletingRate, setDeletingRate] = useState<RateReference | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  // Filtered dataset
  const filteredRates = useMemo(() => {
    return rates.filter((rate) => {
      // 1. Search filter (city, destination, clientName, originPlant)
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchCity = rate.city.toLowerCase().includes(query)
        const matchDest = rate.destination.toLowerCase().includes(query)
        const matchClient = rate.clientName.toLowerCase().includes(query)
        const matchOrigin = rate.originPlant?.toLowerCase().includes(query)
        if (!matchCity && !matchDest && !matchClient && !matchOrigin)
          return false
      }

      // 2. Client filter
      if (selectedClient !== "ALL" && rate.clientName !== selectedClient) {
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

  const handleToggleStatus = async (rate: RateReference) => {
    try {
      const res = await toggleRateReferenceStatus(rate.id, !rate.isActive)
      if (res.success) {
        toast.success(
          rate.isActive
            ? `Rute ${rate.destination} dinonaktifkan`
            : `Rute ${rate.destination} diaktifkan kembali`
        )
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal mengubah status rute")
    }
  }

  const handleDelete = async () => {
    if (!deletingRate) return
    setIsDeleting(true)
    try {
      const res = await deleteRateReference(deletingRate.id)
      if (res.success) {
        toast.success(`Rute ${deletingRate.destination} berhasil dihapus`)
        setDeletingRate(null)
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal menghapus rute")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar Terpadu */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md md:max-w-lg">
          <RiSearchLine className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Cari kota, tujuan, atau pabrik..."
            className="h-9 w-full rounded-lg border-border/70 bg-card/60 pl-9 text-xs shadow-2xs focus-visible:ring-1"
          />
        </div>

        {/* Filter Group: Dibungkus Menjadi Satu Kontainer */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex w-full items-center gap-1.5 rounded-xl border border-border/80 bg-muted/40 p-1 shadow-2xs sm:w-auto">
            <div className="hidden items-center gap-1 px-2 text-xs font-medium text-muted-foreground sm:flex">
              <RiFilterLine className="size-3.5" />
              <span>Filter:</span>
            </div>

            {/* Filter Klien */}
            <Select
              value={selectedClient}
              onValueChange={(val) => {
                if (val) {
                  setSelectedClient(val)
                  setCurrentPage(1)
                }
              }}
            >
              <SelectTrigger className="h-7.5 min-w-0 flex-1 rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:w-40 sm:flex-none">
                <SelectValue>
                  {selectedClient === "ALL" ? "Semua Pabrik" : selectedClient}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-medium">
                  Semua Pabrik
                </SelectItem>
                {distinctClients.map((client) => (
                  <SelectItem key={client} value={client} className="text-xs">
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filter Status */}
            <Select
              value={selectedStatus}
              onValueChange={(val) => {
                if (val) {
                  setSelectedStatus(val)
                  setCurrentPage(1)
                }
              }}
            >
              <SelectTrigger className="h-7.5 min-w-0 flex-1 rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50 sm:w-32 sm:flex-none">
                <SelectValue>
                  {selectedStatus === "ALL"
                    ? "Semua Status"
                    : selectedStatus === "ACTIVE"
                      ? "Aktif"
                      : "Non-Aktif"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-medium">
                  Semua Status
                </SelectItem>
                <SelectItem value="ACTIVE" className="text-xs">
                  Aktif
                </SelectItem>
                <SelectItem value="INACTIVE" className="text-xs">
                  Non-Aktif
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Page Size: Hanya Tampil Selain di Mobile (Tablet & Desktop) */}
            <div className="hidden sm:block">
              <Select
                value={pageSize.toString()}
                onValueChange={(val) => {
                  if (val) {
                    setPageSize(Number(val))
                    setCurrentPage(1)
                  }
                }}
              >
                <SelectTrigger className="h-7.5 w-28 rounded-lg border-border/60 bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs hover:bg-accent/50">
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

            {/* Reset Button saat filter aktif */}
            {(Boolean(search.trim()) ||
              selectedClient !== "ALL" ||
              selectedStatus !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setSelectedClient("ALL")
                  setSelectedStatus("ALL")
                  setCurrentPage(1)
                }}
                className="h-7.5 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RiCloseLine className="size-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
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
                  ? "Tidak ada referensi tarif yang sesuai dengan pencarian atau filter aktif."
                  : "Daftar referensi tarif pabrik masih kosong. Mulai tambahkan rute pertama Anda."}
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              {isFiltered ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="gap-1.5"
                >
                  <RiCloseLine className="size-3.5" />
                  <span>Reset Filter</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsCreateOpen(true)}
                  className="gap-1.5"
                >
                  <RiAddLine className="size-4" />
                  <span>Tambah Tarif Baru</span>
                </Button>
              )}
            </EmptyContent>
          </Empty>
        ) : (
          paginatedRates.map((rate) => (
            <RateMobileCard
              key={rate.id}
              rate={rate}
              onEdit={setEditingRate}
              onToggleStatus={handleToggleStatus}
              onDelete={setDeletingRate}
            />
          ))
        )}
      </div>

      {/* Desktop Table Container (>= md) */}
      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-xs md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-center text-xs">No</TableHead>
                <TableHead className="text-xs font-semibold">
                  Pabrik Asal
                </TableHead>
                <TableHead className="text-xs font-semibold">
                  Kota Tujuan
                </TableHead>
                <TableHead className="min-w-45 text-xs font-semibold">
                  Tujuan Bongkar (Proyek / BP)
                </TableHead>
                <TableHead className="text-right text-xs font-semibold">
                  Tarif OA / Ton
                </TableHead>
                <TableHead className="text-right text-xs font-semibold">
                  % Sangu
                </TableHead>
                <TableHead className="text-right text-xs font-semibold">
                  Acuan UJ (31t)
                </TableHead>
                <TableHead className="text-center text-xs font-semibold">
                  Potongan
                </TableHead>
                <TableHead className="text-center text-xs font-semibold">
                  Status
                </TableHead>
                <TableHead className="w-12 text-center text-xs">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRates.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={10} className="p-0">
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
                            <span>Tambah Tarif Baru</span>
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
                  const numTon = parseFloat(rate.standardTonnage)
                  const estimatedSangu =
                    Math.round((numRate * numTon * numPct) / 1000) * 1000
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1

                  return (
                    <TableRow
                      key={rate.id}
                      className="text-xs hover:bg-muted/30"
                    >
                      <TableCell className="text-center font-mono text-muted-foreground">
                        {rowNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-primary/20 bg-primary/5 text-[11px] font-semibold text-primary"
                        >
                          {rate.originPlant || rate.clientName}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-foreground">
                        {rate.city}
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {rate.destination}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(numRate)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {(numPct * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {rate.defaultSangu
                          ? formatCurrency(parseFloat(rate.defaultSangu))
                          : formatCurrency(estimatedSangu)}
                      </TableCell>
                      <TableCell className="text-center">
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
                      <TableCell className="text-center">
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
                      <TableCell className="text-center">
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
                                Aksi Rute
                              </DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-xs"
                                onClick={() => setEditingRate(rate)}
                              >
                                <RiEditLine className="size-3.5" />
                                <span>Edit Tarif</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-xs"
                                onClick={() => handleToggleStatus(rate)}
                              >
                                {rate.isActive ? (
                                  <>
                                    <RiCloseLine className="size-3.5 text-amber-600" />
                                    <span>Nonaktifkan</span>
                                  </>
                                ) : (
                                  <>
                                    <RiCheckLine className="size-3.5 text-emerald-600" />
                                    <span>Aktifkan</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="cursor-pointer gap-2 text-xs text-destructive focus:text-destructive"
                                onClick={() => setDeletingRate(rate)}
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
      </div>

      {/* Pagination Footer (Mobile & Desktop) */}
      <div className="flex flex-col items-center justify-between gap-3 rounded-xl border bg-card p-3 text-xs text-muted-foreground shadow-xs sm:flex-row sm:px-4">
        <div>
          Menampilkan{" "}
          <strong>
            {filteredRates.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </strong>{" "}
          -{" "}
          <strong>
            {Math.min(currentPage * pageSize, filteredRates.length)}
          </strong>{" "}
          dari <strong>{filteredRates.length}</strong> rute
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Sebelumnya
          </Button>
          <span className="px-2 font-medium text-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
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
        distinctClients={distinctClients}
        distinctOriginPlants={distinctOriginPlants}
      />

      {/* Edit Dialog Modal */}
      {editingRate && (
        <RateFormDialog
          mode="edit"
          rate={editingRate}
          open={!!editingRate}
          onOpenChange={(isOpen) => !isOpen && setEditingRate(null)}
          distinctClients={distinctClients}
          distinctOriginPlants={distinctOriginPlants}
        />
      )}

      {/* Confirm Delete Dialog */}
      <Dialog
        open={!!deletingRate}
        onOpenChange={(isOpen) => !isOpen && setDeletingRate(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-destructive">
              <RiDeleteBinLine className="size-5" />
              Hapus Referensi Rute?
            </DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus rute tujuan{" "}
              <strong>&ldquo;{deletingRate?.destination}&rdquo;</strong> di kota{" "}
              <strong>{deletingRate?.city}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeletingRate(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus Rute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
