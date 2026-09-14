"use client"

import { useMemo, useState } from "react"
import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFilterLine,
  RiMoreLine,
  RiPercentLine,
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
}

export function RatesTable({ rates, distinctClients }: RatesTableProps) {
  const [search, setSearch] = useState("")
  const [selectedClient, setSelectedClient] = useState<string>("ALL")
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL")

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  // Dialog action state
  const [editingRate, setEditingRate] = useState<RateReference | null>(null)
  const [deletingRate, setDeletingRate] = useState<RateReference | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtered dataset
  const filteredRates = useMemo(() => {
    return rates.filter((rate) => {
      // 1. Search filter (city, destination, clientName)
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchCity = rate.city.toLowerCase().includes(query)
        const matchDest = rate.destination.toLowerCase().includes(query)
        const matchClient = rate.clientName.toLowerCase().includes(query)
        if (!matchCity && !matchDest && !matchClient) return false
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
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-sm flex-1">
          <RiSearchLine className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            placeholder="Cari kota, tujuan, atau pabrik..."
            className="pl-9 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5">
          {/* Filter Klien */}
          <div className="flex items-center gap-1.5">
            <RiFilterLine className="hidden size-4 text-muted-foreground sm:inline" />
            <Select
              value={selectedClient}
              onValueChange={(val) => {
                if (val) {
                  setSelectedClient(val)
                  setCurrentPage(1)
                }
              }}
            >
              <SelectTrigger className="h-9 w-full text-xs sm:w-40">
                <SelectValue placeholder="Pabrik Klien" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  Semua Pabrik
                </SelectItem>
                {distinctClients.map((client) => (
                  <SelectItem key={client} value={client} className="text-xs">
                    {client}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <SelectTrigger className="h-9 w-full text-xs sm:w-32.5">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">
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

          {/* Page Size */}
          <div className="col-span-2 sm:col-auto">
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                if (val) {
                  setPageSize(Number(val))
                  setCurrentPage(1)
                }
              }}
            >
              <SelectTrigger className="h-9 w-full text-xs sm:w-27.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10" className="text-xs">
                  10 baris
                </SelectItem>
                <SelectItem value="25" className="text-xs">
                  25 baris
                </SelectItem>
                <SelectItem value="50" className="text-xs">
                  50 baris
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mobile Cards View (< md) */}
      <div className="block space-y-3 md:hidden">
        {paginatedRates.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            Tidak ada referensi tarif yang sesuai dengan pencarian.
          </div>
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
                  Pabrik Klien
                </TableHead>
                <TableHead className="text-xs font-semibold">Kota</TableHead>
                <TableHead className="min-w-45 text-xs font-semibold">
                  Tujuan Pabrik / Plant
                </TableHead>
                <TableHead className="text-right text-xs font-semibold">
                  Tarif / Ton
                </TableHead>
                <TableHead className="text-right text-xs font-semibold">
                  % Sangu
                </TableHead>
                <TableHead className="text-right text-xs font-semibold">
                  Acuan Sangu (31t)
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
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    Tidak ada referensi tarif yang sesuai dengan pencarian.
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
                          className="text-[11px] font-medium"
                        >
                          {rate.clientName}
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
                        {formatCurrency(estimatedSangu)}
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
                              />
                            }
                          >
                            <RiMoreLine className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuLabel className="text-xs">
                              Aksi Rute
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
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

      {/* Edit Dialog Modal */}
      {editingRate && (
        <RateFormDialog
          mode="edit"
          rate={editingRate}
          open={!!editingRate}
          onOpenChange={(isOpen) => !isOpen && setEditingRate(null)}
          distinctClients={distinctClients}
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
