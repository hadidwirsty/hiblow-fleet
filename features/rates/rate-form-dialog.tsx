/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"
import { RiAddLine, RiRouteLine } from "@remixicon/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { RateReference } from "@/db/schema"
import {
  createRateReference,
  updateRateReference,
} from "@/features/rates/rates.actions"
import { formatCurrency } from "@/lib/utils"

function parseCurrencyInput(value: string): string {
  const cleaned = value.trim()
  if (!cleaned) return ""

  if (cleaned.includes(",")) {
    const parts = cleaned.split(",")
    const intPart = parts[0].replace(/\D/g, "")
    const decPart = parts.slice(1).join("").replace(/\D/g, "")
    if (cleaned.endsWith(",")) {
      return `${intPart}.`
    }
    return decPart ? `${intPart}.${decPart}` : intPart
  }

  if (cleaned.includes(".")) {
    const parts = cleaned.split(".")
    if (parts.length === 2 && parts[0].length > 3 && parts[1].length <= 2) {
      return cleaned
    }
    return cleaned.replace(/\./g, "").replace(/\D/g, "")
  }

  return cleaned.replace(/\D/g, "")
}

function formatCurrencyInput(value: string): string {
  if (!value) return ""

  let intPart = ""
  let decPart = ""
  const hasCommaEnding = value.endsWith(".") || value.endsWith(",")

  if (value.includes(".")) {
    const parts = value.split(".")
    intPart = parts[0].replace(/\D/g, "")
    decPart = parts[1] === "00" || parts[1] === "0" ? "" : parts[1]
  } else {
    intPart = value.replace(/\D/g, "")
  }

  if (!intPart && !decPart) return ""
  const formattedInt = intPart
    ? new Intl.NumberFormat("id-ID").format(Number(intPart))
    : "0"

  if (hasCommaEnding) {
    return `${formattedInt},`
  }
  return decPart ? `${formattedInt},${decPart}` : formattedInt
}

interface RateFormDialogProps {
  mode?: "create" | "edit"
  rate?: RateReference
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  distinctClients?: string[]
  distinctOriginPlants?: string[]
}

const DEFAULT_ORIGIN_PLANTS = [
  "Semen Indonesia (SI) - Tuban",
  "Semen Indonesia (SI) - Rembang",
  "Solusi Bangun Indonesia (SBI) - Tuban",
  "Indocement - Grobogan",
]

export function RateFormDialog({
  mode = "create",
  rate,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  distinctOriginPlants = DEFAULT_ORIGIN_PLANTS,
}: RateFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [originPlant, setOriginPlant] = useState(rate?.originPlant ?? "")
  const [clientName, setClientName] = useState(rate?.clientName ?? "")
  const [city, setCity] = useState(rate?.city ?? "")
  const [destination, setDestination] = useState(rate?.destination ?? "")
  const [ratePerTon, setRatePerTon] = useState(rate?.ratePerTon ?? "")
  const [standardTonnage, setStandardTonnage] = useState(
    rate?.standardTonnage ?? ""
  )
  const [sanguPercentage, setSanguPercentage] = useState(
    rate?.sanguPercentage
      ? (parseFloat(rate.sanguPercentage) * 100).toString()
      : ""
  )
  const [defaultSangu, setDefaultSangu] = useState(rate?.defaultSangu ?? "")
  const [additionalTonnageRate, setAdditionalTonnageRate] = useState(
    rate?.additionalTonnageRate ?? ""
  )
  const [hasSpecialDeductions, setHasSpecialDeductions] = useState(
    rate?.hasSpecialDeductions ?? false
  )
  const [isActive, setIsActive] = useState(rate?.isActive ?? true)

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (mode === "edit" && rate) {
        setOriginPlant(rate.originPlant ?? "")
        setClientName(rate.clientName ?? "")
        setCity(rate.city ?? "")
        setDestination(rate.destination ?? "")
        setRatePerTon(rate.ratePerTon ?? "")
        setStandardTonnage(rate.standardTonnage ?? "")
        setSanguPercentage(
          rate.sanguPercentage
            ? (parseFloat(rate.sanguPercentage) * 100).toString()
            : ""
        )
        setDefaultSangu(rate.defaultSangu ?? "")
        setAdditionalTonnageRate(rate.additionalTonnageRate ?? "")
        setHasSpecialDeductions(rate.hasSpecialDeductions ?? false)
        setIsActive(rate.isActive ?? true)
      } else if (mode === "create") {
        setOriginPlant("")
        setClientName("")
        setCity("")
        setDestination("")
        setRatePerTon("")
        setStandardTonnage("")
        setSanguPercentage("")
        setDefaultSangu("")
        setAdditionalTonnageRate("")
        setHasSpecialDeductions(false)
        setIsActive(true)
      }
      setError(null)
    }
  }, [open, mode, rate])

  const numRate = parseFloat(ratePerTon) || 0
  const numTon = parseFloat(standardTonnage) || 0
  const numPct = (parseFloat(sanguPercentage) || 0) / 100
  const estimatedSangu =
    numRate > 0 && numTon > 0 && numPct > 0
      ? Math.round((numRate * numTon * numPct) / 1000) * 1000
      : 0
  const numAdditionalRate = parseFloat(additionalTonnageRate) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const decimalSangu = sanguPercentage
      ? (parseFloat(sanguPercentage) / 100).toFixed(4)
      : "0.5200"
    const cleanRatePerTon = ratePerTon.endsWith(".")
      ? ratePerTon.slice(0, -1)
      : ratePerTon
    const cleanAdditionalTonnageRate = additionalTonnageRate.endsWith(".")
      ? additionalTonnageRate.slice(0, -1)
      : additionalTonnageRate || "0.00"

    const derivedClientName =
      clientName ||
      (originPlant.includes("SBI")
        ? "SBI"
        : originPlant.includes("Grobogan") || originPlant.includes("Indocement")
          ? "Indocement Grobogan"
          : originPlant.includes("Rembang")
            ? "SI Rembang"
            : originPlant
              ? originPlant.split("-")[0].trim()
              : "SI")

    const cleanDefaultSangu = defaultSangu
      ? defaultSangu.endsWith(".")
        ? defaultSangu.slice(0, -1)
        : defaultSangu
      : undefined

    const finalStandardTonnage = standardTonnage || "31.00"

    try {
      if (mode === "create") {
        const res = await createRateReference({
          originPlant: originPlant.trim(),
          clientName: derivedClientName,
          city: city.toUpperCase().trim(),
          destination: destination.toUpperCase().trim(),
          ratePerTon: cleanRatePerTon,
          standardTonnage: finalStandardTonnage,
          sanguPercentage: decimalSangu,
          defaultSangu: cleanDefaultSangu,
          additionalTonnageRate: cleanAdditionalTonnageRate,
          hasSpecialDeductions,
          isActive,
        })

        if (res.success) {
          toast.success("Referensi tarif rute baru berhasil disimpan")
          setOpen(false)
          setClientName("")
          setCity("")
          setDestination("")
          setRatePerTon("")
          setStandardTonnage("31.00")
          setSanguPercentage("52")
          setDefaultSangu("")
          setAdditionalTonnageRate("25000")
        } else {
          setError(res.error)
        }
      } else if (mode === "edit" && rate) {
        const res = await updateRateReference({
          id: rate.id,
          originPlant: originPlant.trim(),
          clientName: derivedClientName,
          city: city.toUpperCase().trim(),
          destination: destination.toUpperCase().trim(),
          ratePerTon: cleanRatePerTon,
          standardTonnage,
          sanguPercentage: decimalSangu,
          defaultSangu: cleanDefaultSangu,
          additionalTonnageRate: cleanAdditionalTonnageRate,
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
        <div onClick={() => setOpen(true)} className="w-full sm:w-auto">
          {trigger ?? (
            <Button
              size="sm"
              className="h-9 w-full gap-1.5 px-4 font-medium shadow-sm sm:w-auto"
            >
              <RiAddLine className="size-4" />
              <span>Tambah Referensi Tarif</span>
            </Button>
          )}
        </div>
      )}

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiRouteLine className="size-4" />
            </div>
            <span>
              {mode === "create"
                ? "Tambah Referensi Tarif"
                : "Edit Referensi Tarif"}
            </span>
          </div>
        }
        description={
          mode === "create"
            ? "Daftarkan rute pabrik baru beserta acuan tarif dan sangu supir"
            : `Perbarui informasi tarif untuk ${rate?.destination}`
        }
        className="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Pabrik Asal */}
          <div className="space-y-1.5">
            <Label htmlFor="originPlant" className="text-xs font-semibold">
              Pabrik Asal (Nama Pabrik - Kota Asal)
            </Label>
            <Input
              id="originPlant"
              value={originPlant}
              onChange={(e) => setOriginPlant(e.target.value)}
              placeholder="mis. Semen Indonesia (SI) - Tuban"
              required
              list="origin-plant-suggestions"
              className="text-sm font-medium"
            />
            <datalist id="origin-plant-suggestions">
              {distinctOriginPlants.map((plant) => (
                <option key={plant} value={plant} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Kota Tujuan Bongkar */}
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-semibold">
                Kota Tujuan Bongkar
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="mis. Semarang"
                required
                className="text-sm"
              />
            </div>

            {/* Nama Proyek / Titik Bongkar */}
            <div className="space-y-1.5">
              <Label htmlFor="destination" className="text-xs font-semibold">
                Tujuan Bongkar (Proyek / BP)
              </Label>
              <Input
                id="destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="mis. PT Ananda Pratama"
                required
                className="text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Tarif per Ton */}
            <div className="space-y-1.5">
              <Label htmlFor="ratePerTon" className="text-xs font-semibold">
                Tarif OA per Ton (Rp)
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="ratePerTon"
                  type="text"
                  inputMode="decimal"
                  value={formatCurrencyInput(ratePerTon)}
                  onChange={(e) =>
                    setRatePerTon(parseCurrencyInput(e.target.value))
                  }
                  placeholder="mis. 67.296"
                  required
                  className="pl-9 text-sm font-medium"
                />
              </div>
            </div>

            {/* Persentase Sangu Supir (%) */}
            <div className="space-y-1.5">
              <Label
                htmlFor="sanguPercentage"
                className="text-xs font-semibold"
              >
                Persentase Sangu (%)
              </Label>
              <div className="relative">
                <Input
                  id="sanguPercentage"
                  type="number"
                  step="any"
                  value={sanguPercentage}
                  onChange={(e) => setSanguPercentage(e.target.value)}
                  placeholder="mis. 52"
                  required
                  className="pr-8 text-sm font-medium"
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
                placeholder="mis. 31.00"
                className="text-sm font-medium"
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
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="additionalTonnageRate"
                  type="text"
                  inputMode="decimal"
                  value={formatCurrencyInput(additionalTonnageRate)}
                  onChange={(e) =>
                    setAdditionalTonnageRate(parseCurrencyInput(e.target.value))
                  }
                  placeholder="mis. 25.000"
                  className="pl-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Acuan Uang Jalan (UJ Standar) */}
          <div className="space-y-1.5">
            <Label htmlFor="defaultSangu" className="text-xs font-semibold">
              Acuan Uang Jalan / Sangu Standar (Rp)
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                id="defaultSangu"
                type="text"
                inputMode="decimal"
                value={formatCurrencyInput(defaultSangu)}
                onChange={(e) =>
                  setDefaultSangu(parseCurrencyInput(e.target.value))
                }
                placeholder={
                  estimatedSangu > 0
                    ? `mis. ${formatCurrencyInput(estimatedSangu.toString())}`
                    : "mis. 1.500.000 (opsional)"
                }
                className="pl-9 text-sm font-medium"
              />
            </div>
          </div>

          {/* Pratinjau Acuan Sangu */}
          <div className="rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">
                Estimasi Sangu Standar (
                {standardTonnage ? `${standardTonnage} Ton` : "Basis 31 Ton"}):
              </span>
              <span className="font-bold text-primary">
                {estimatedSangu > 0 ? formatCurrency(estimatedSangu) : "Rp -"}
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

          <div className="flex items-center justify-end gap-2 border-t px-2 pt-3 sm:px-0">
            <Button
              type="button"
              variant="outline"
              className="w-1/2 sm:w-36"
              size="lg"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="w-1/2 sm:w-36"
              size="lg"
              disabled={isPending}
            >
              {isPending
                ? "Menyimpan..."
                : mode === "create"
                  ? "Simpan Rute"
                  : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </>
  )
}
