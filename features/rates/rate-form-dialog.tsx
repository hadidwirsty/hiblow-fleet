"use client"

import { useState } from "react"
import { RiAddLine, RiRouteLine } from "@remixicon/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { RateReference } from "@/db/schema"
import {
  createRateReference,
  updateRateReference,
} from "@/features/rates/rates.actions"
import { formatCurrency } from "@/lib/utils"

interface RateFormDialogProps {
  mode?: "create" | "edit"
  rate?: RateReference
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  distinctClients?: string[]
}

export function RateFormDialog({
  mode = "create",
  rate,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  distinctClients = ["SI", "SBI", "Indocement Grobogan"],
}: RateFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [clientName, setClientName] = useState(rate?.clientName ?? "SI")
  const [city, setCity] = useState(rate?.city ?? "")
  const [destination, setDestination] = useState(rate?.destination ?? "")
  const [ratePerTon, setRatePerTon] = useState(rate?.ratePerTon ?? "")
  const [standardTonnage, setStandardTonnage] = useState(
    rate?.standardTonnage ?? "31.00"
  )
  const [sanguPercentage, setSanguPercentage] = useState(
    rate?.sanguPercentage
      ? (parseFloat(rate.sanguPercentage) * 100).toString()
      : "52"
  )
  const [additionalTonnageRate, setAdditionalTonnageRate] = useState(
    rate?.additionalTonnageRate ?? "25000.00"
  )
  const [hasSpecialDeductions, setHasSpecialDeductions] = useState(
    rate?.hasSpecialDeductions ?? false
  )
  const [isActive, setIsActive] = useState(rate?.isActive ?? true)

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hitung live acuan sangu supir (tonase standar * tarif * % sangu dibulatkan ke ribuan)
  const numRate = parseFloat(ratePerTon) || 0
  const numTon = parseFloat(standardTonnage) || 31
  const numPct = (parseFloat(sanguPercentage) || 52) / 100
  const estimatedSangu = Math.round((numRate * numTon * numPct) / 1000) * 1000

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    // Normalisasi sanguPercentage dari skala 0-100 (misal 52) ke desimal (0.5200)
    const decimalSangu = (parseFloat(sanguPercentage) / 100).toFixed(4)

    try {
      if (mode === "create") {
        const res = await createRateReference({
          clientName,
          city: city.toUpperCase().trim(),
          destination: destination.toUpperCase().trim(),
          ratePerTon,
          standardTonnage,
          sanguPercentage: decimalSangu,
          additionalTonnageRate,
          hasSpecialDeductions,
          isActive,
        })

        if (res.success) {
          toast.success("Referensi tarif rute baru berhasil disimpan")
          setOpen(false)
          // Reset form jika mode create
          setCity("")
          setDestination("")
          setRatePerTon("")
        } else {
          setError(res.error)
        }
      } else if (mode === "edit" && rate) {
        const res = await updateRateReference({
          id: rate.id,
          clientName,
          city: city.toUpperCase().trim(),
          destination: destination.toUpperCase().trim(),
          ratePerTon,
          standardTonnage,
          sanguPercentage: decimalSangu,
          additionalTonnageRate,
          hasSpecialDeductions,
          isActive,
        })

        if (res.success) {
          toast.success("Referensi tarif rute berhasil diperbarui")
          setOpen(false)
        } else {
          setError(res.error)
        }
      }
    } catch {
      setError("Terjadi kesalahan sistem saat menyimpan tarif")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      {!isControlled && (
        <div onClick={() => setOpen(true)} className="inline-block">
          {trigger ?? (
            <Button size="sm" className="gap-1.5 font-medium shadow-sm">
              <RiAddLine className="size-4" />
              <span>Tambah Rute Baru</span>
            </Button>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <RiRouteLine className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  {mode === "create"
                    ? "Tambah Referensi Tarif"
                    : "Edit Referensi Tarif"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {mode === "create"
                    ? "Daftarkan rute pabrik baru beserta acuan tarif dan sangu supir"
                    : `Perbarui informasi tarif untuk ${rate?.destination}`}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Pabrik Klien */}
            <div className="space-y-1.5">
              <Label htmlFor="clientName" className="text-xs font-semibold">
                Pabrik Klien / Produsen Semen
              </Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Contoh: SI, SBI, Indocement Grobogan"
                required
                list="client-suggestions"
                className="text-sm uppercase"
              />
              <datalist id="client-suggestions">
                {distinctClients.map((client) => (
                  <option key={client} value={client} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Kota Tujuan */}
              <div className="space-y-1.5">
                <Label htmlFor="city" className="text-xs font-semibold">
                  Kota Tujuan
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: KUDUS"
                  required
                  className="text-sm uppercase"
                />
              </div>

              {/* Nama Pabrik / Batching Plant */}
              <div className="space-y-1.5">
                <Label htmlFor="destination" className="text-xs font-semibold">
                  Nama Pabrik / Tujuan
                </Label>
                <Input
                  id="destination"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Contoh: VARIA USAHA"
                  required
                  className="text-sm uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Tarif per Ton */}
              <div className="space-y-1.5">
                <Label htmlFor="ratePerTon" className="text-xs font-semibold">
                  Tarif per Ton (Rp)
                </Label>
                <Input
                  id="ratePerTon"
                  type="number"
                  step="any"
                  value={ratePerTon}
                  onChange={(e) => setRatePerTon(e.target.value)}
                  placeholder="62795.50"
                  required
                  className="text-sm font-medium"
                />
              </div>

              {/* Persentase Sangu Supir (%) */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="sanguPercentage"
                  className="text-xs font-semibold"
                >
                  Sangu Supir (%)
                </Label>
                <div className="relative">
                  <Input
                    id="sanguPercentage"
                    type="number"
                    step="any"
                    value={sanguPercentage}
                    onChange={(e) => setSanguPercentage(e.target.value)}
                    placeholder="52"
                    required
                    className="pr-8 text-sm"
                  />
                  <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Tonase Standar */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="standardTonnage"
                  className="text-xs font-semibold"
                >
                  Tonase Standar (Ton)
                </Label>
                <Input
                  id="standardTonnage"
                  type="number"
                  step="any"
                  value={standardTonnage}
                  onChange={(e) => setStandardTonnage(e.target.value)}
                  placeholder="31.00"
                  required
                  className="text-sm"
                />
              </div>

              {/* Tarif Kelebihan Tonase */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="additionalTonnageRate"
                  className="text-xs font-semibold"
                >
                  Tarif Lebih Tonase (Rp/t)
                </Label>
                <Input
                  id="additionalTonnageRate"
                  type="number"
                  step="any"
                  value={additionalTonnageRate}
                  onChange={(e) => setAdditionalTonnageRate(e.target.value)}
                  placeholder="25000"
                  required
                  className="text-sm"
                />
              </div>
            </div>

            {/* Pratinjau Acuan Sangu */}
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">
                  Estimasi Sangu Standar ({standardTonnage} Ton):
                </span>
                <span className="font-bold text-primary">
                  {formatCurrency(estimatedSangu)}
                </span>
              </div>
            </div>

            {/* Opsi Tambahan */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasSpecialDeductions"
                  checked={hasSpecialDeductions}
                  onCheckedChange={(checked) =>
                    setHasSpecialDeductions(checked === true)
                  }
                />
                <Label
                  htmlFor="hasSpecialDeductions"
                  className="text-xs leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Rute Potongan Khusus (Pajak 1%, Pot 2% LJU, 5% UJ GRB)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setIsActive(checked === true)}
                />
                <Label
                  htmlFor="isActive"
                  className="text-xs leading-none font-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Status Rute Aktif (tersedia saat input ritase baru)
                </Label>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
              >
                {error}
              </div>
            )}

            <DialogFooter className="gap-2 pt-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending
                  ? "Menyimpan..."
                  : mode === "create"
                    ? "Simpan Rute"
                    : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
