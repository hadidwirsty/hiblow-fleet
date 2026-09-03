/* eslint-disable react-hooks/incompatible-library */
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  RiAddLine,
  RiCalculatorLine,
  RiInformationLine,
  RiLoaderLine,
  RiTruckLine,
} from "@remixicon/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createTrip } from "@/features/trips/trips.actions"
import { createTripSchema } from "@/features/trips/trips.schema"
import { formatCurrency } from "@/lib/utils"
import { calculateOmset } from "@/src/domain/calculators/omset"
import { calculateSangu } from "@/src/domain/calculators/sangu"
import { calculateTripProfit } from "@/src/domain/calculators/trip-profit"

import {
  TripDestinationCombobox,
  type RateReferenceRecord,
} from "./trip-destination-combobox"
import type { CreateTripInput } from "./trips.schema"

interface TripFormDialogProps {
  rateReferences: RateReferenceRecord[]
}

export function TripFormDialog({ rateReferences }: TripFormDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Internal rate reference calculation states
  const [selectedRateId, setSelectedRateId] = React.useState<string | null>(
    null
  )
  const [sanguPercentage, setSanguPercentage] = React.useState<number>(0.52)
  const [hasSpecialDeductions, setHasSpecialDeductions] =
    React.useState<boolean>(false)

  // Get current date string YYYY-MM-DD
  const todayStr = new Date().toISOString().split("T")[0]

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<
    z.input<typeof createTripSchema>,
    unknown,
    z.output<typeof createTripSchema>
  >({
    resolver: zodResolver(createTripSchema),
    defaultValues: {
      truckId: "W8187UA",
      orderNumber: 1,
      orderDate: todayStr,
      unloadingDate: "",
      destinationCity: "",
      destinationName: "",
      ratePerTon: "95000",
      loadedTonnage: "",
      unloadedTonnage: "31.00",
      omset: "2945000.00",
      sangu: "1531000.00",
      profit: "1414000.00",
      incentiveRate: "35000.00",
      incentivePaid: "0.00",
      thirdPartyFee: "0.00",
      tax1Pct: "0.00",
      deduction2PctLju: "0.00",
      deduction5PctUjGrb: "0.00",
      mealAllowance: "0.00",
      savings: "0.00",
      claim: "0.00",
      claimDriver: "0.00",
      notes: "",
    },
  })

  // Watch fields for live reactive calculation
  const watchedTruckId = watch("truckId")
  const watchedRatePerTon = watch("ratePerTon")
  const watchedUnloadedTonnage = watch("unloadedTonnage")
  const watchedThirdPartyFee = watch("thirdPartyFee")
  const watchedMealAllowance = watch("mealAllowance")
  const watchedSavings = watch("savings")
  const watchedClaim = watch("claim")
  const watchedClaimDriver = watch("claimDriver")

  // Live calculation effect
  const liveCalc = React.useMemo(() => {
    const rateNum = parseFloat(watchedRatePerTon ?? "0") || 0
    const tonnageNum = parseFloat(watchedUnloadedTonnage ?? "0") || 0
    const thirdPartyNum = parseFloat(watchedThirdPartyFee ?? "0") || 0
    const mealNum = parseFloat(watchedMealAllowance ?? "0") || 0
    const savingsNum = parseFloat(watchedSavings ?? "0") || 0
    const claimNum = parseFloat(watchedClaim ?? "0") || 0
    const claimDriverNum = parseFloat(watchedClaimDriver ?? "0") || 0

    const omset = calculateOmset({
      ratePerTon: rateNum,
      unloadedTonnage: tonnageNum,
    })

    const sangu = calculateSangu({
      ratePerTon: rateNum,
      unloadedTonnage: tonnageNum,
      sanguPercentage,
    })

    let tax1Pct = 0
    let deduction2PctLju = 0
    let deduction5PctUjGrb = 0

    if (hasSpecialDeductions && omset > 0) {
      tax1Pct = Math.round(0.01 * omset)
      deduction2PctLju = Math.round(0.02 * omset)
      deduction5PctUjGrb = Math.round(0.05 * omset)
    }

    const profitResult = calculateTripProfit({
      omset,
      sangu,
      thirdPartyFee: thirdPartyNum,
      tax1Pct,
      deduction2PctLju,
      deduction5PctUjGrb,
      mealAllowance: mealNum,
      savings: savingsNum,
      claim: claimNum,
      claimDriver: claimDriverNum,
    })

    return {
      omset,
      sangu,
      tax1Pct,
      deduction2PctLju,
      deduction5PctUjGrb,
      profit: profitResult.profit,
    }
  }, [
    watchedRatePerTon,
    watchedUnloadedTonnage,
    watchedThirdPartyFee,
    watchedMealAllowance,
    watchedSavings,
    watchedClaim,
    watchedClaimDriver,
    sanguPercentage,
    hasSpecialDeductions,
  ])

  // Synchronize computed numbers with form values
  React.useEffect(() => {
    setValue("omset", liveCalc.omset.toFixed(2))
    setValue("sangu", liveCalc.sangu.toFixed(2))
    setValue("profit", liveCalc.profit.toFixed(2))
    setValue("tax1Pct", liveCalc.tax1Pct.toFixed(2))
    setValue("deduction2PctLju", liveCalc.deduction2PctLju.toFixed(2))
    setValue("deduction5PctUjGrb", liveCalc.deduction5PctUjGrb.toFixed(2))
  }, [liveCalc, setValue])

  // Handle route selection from combobox
  function handleRouteSelect(rateRef: RateReferenceRecord) {
    setSelectedRateId(rateRef.id)
    setValue("rateReferenceId", rateRef.id)
    setValue("destinationCity", rateRef.city)
    setValue("destinationName", rateRef.destination)
    setValue("ratePerTon", parseFloat(rateRef.ratePerTon).toString())
    setSanguPercentage(parseFloat(rateRef.sanguPercentage))
    setHasSpecialDeductions(rateRef.hasSpecialDeductions)
  }

  // Handle form submission
  async function onSubmit(data: CreateTripInput) {
    setIsSubmitting(true)
    try {
      const res = await createTrip(data)
      if (res.success) {
        toast.success("Surat jalan ritase berhasil disimpan ke database!")
        setOpen(false)
        reset()
        setSelectedRateId(null)
      } else {
        toast.error(res.error || "Gagal menyimpan ritase.")
      }
    } catch {
      toast.error("Terjadi kendala jaringan saat menyimpan ritase.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Button
        id="btn-input-trip"
        onClick={() => setOpen(true)}
        className="gap-1.5 shadow-sm"
      >
        <RiAddLine className="size-4" />
        <span>Input Ritase Baru</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-6">
          <DialogHeader className="pb-2">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <RiTruckLine className="size-5 text-primary" />
              <span>Input Ritase Baru</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Catat order pengiriman semen curah. Tarif dan uang sangu supir
              terhitung otomatis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Row 1: Unit Armada & Nomor Order */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Unit Truk</Label>
                <Select
                  value={watchedTruckId}
                  onValueChange={(val) => {
                    if (val === "W8187UA" || val === "H8133OF") {
                      setValue("truckId", val)
                    }
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih unit armada" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="W8187UA">
                      W 8187 UA (Hino 500)
                    </SelectItem>
                    <SelectItem value="H8133OF">
                      H 8133 OF (Hino 500)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Nomor Order / Surat Jalan
                </Label>
                <Input
                  type="number"
                  {...register("orderNumber", { valueAsNumber: true })}
                  className="h-9 font-mono text-xs"
                  placeholder="Contoh: 121"
                />
                {errors.orderNumber && (
                  <p className="text-[11px] text-destructive">
                    {errors.orderNumber.message}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Tanggal Order & Tanggal Bongkar */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Tanggal Order <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  {...register("orderDate")}
                  className="h-9 font-mono text-xs"
                />
                {errors.orderDate && (
                  <p className="text-[11px] text-destructive">
                    {errors.orderDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    Tanggal Bongkar
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    (Pengakuan Bagi Hasil)
                  </span>
                </div>
                <Input
                  type="date"
                  {...register("unloadingDate")}
                  className="h-9 font-mono text-xs"
                />
              </div>
            </div>

            {/* Row 3: Rute & Tujuan Pabrik (Combobox) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Rute / Tujuan Pabrik{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Pilih dari 289 rute acuan
                </span>
              </div>
              <TripDestinationCombobox
                rateReferences={rateReferences}
                selectedId={selectedRateId}
                onSelect={handleRouteSelect}
              />
              {errors.destinationCity && (
                <p className="text-[11px] text-destructive">
                  Kota dan tujuan wajib dipilih
                </p>
              )}
            </div>

            {/* Row 4: Tarif per Ton, Tonase Bongkar, Tonase Muat */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Tarif / Ton (Rp)
                </Label>
                <Input
                  type="number"
                  step="100"
                  {...register("ratePerTon")}
                  className="h-9 font-mono text-xs"
                />
                {errors.ratePerTon && (
                  <p className="text-[11px] text-destructive">
                    {errors.ratePerTon.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    Tonase Bongkar <span className="text-destructive">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    Maks Sangu 31T
                  </span>
                </div>
                <Input
                  type="number"
                  step="0.01"
                  {...register("unloadedTonnage")}
                  className="h-9 font-mono text-xs font-semibold"
                  placeholder="31.00"
                />
                {errors.unloadedTonnage && (
                  <p className="text-[11px] text-destructive">
                    {errors.unloadedTonnage.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">
                  Tonase Muat (Opsional)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register("loadedTonnage")}
                  className="h-9 font-mono text-xs"
                  placeholder="31.50"
                />
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <RiCalculatorLine className="size-4" />
                  <span>Kalkulasi Otomatis (Live)</span>
                </div>
                <Badge
                  variant="outline"
                  className="py-0 text-[10px] font-normal"
                >
                  Sangu {Math.round(sanguPercentage * 100)}% (Maks 31 Ton)
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-primary/10 pt-1 text-center">
                <div>
                  <span className="block text-[10px] text-muted-foreground">
                    Omset Bruto
                  </span>
                  <span className="font-mono text-sm font-bold">
                    {formatCurrency(liveCalc.omset)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">
                    Sangu Supir
                  </span>
                  <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(liveCalc.sangu)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-muted-foreground">
                    Laba Ritase
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(liveCalc.profit)}
                  </span>
                </div>
              </div>

              {hasSpecialDeductions && (
                <div className="mt-2 flex items-center justify-between border-t border-dashed border-primary/10 pt-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                    <RiInformationLine className="size-3.5" />
                    Potongan Khusus Grobogan/LJU (8% dari Omset):
                  </span>
                  <span className="font-mono font-medium">
                    {formatCurrency(
                      liveCalc.tax1Pct +
                        liveCalc.deduction2PctLju +
                        liveCalc.deduction5PctUjGrb
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Optional: Fee Pihak Ketiga & Potongan Tambahan */}
            <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Fee Pihak Ketiga / DO (Rp)
                </Label>
                <Input
                  type="number"
                  step="1000"
                  {...register("thirdPartyFee")}
                  className="h-8 font-mono text-xs"
                  placeholder="0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Nama Pihak Ketiga
                </Label>
                <Input
                  type="text"
                  {...register("thirdPartyName")}
                  className="h-8 text-xs"
                  placeholder="Mas Mawan / SILOG"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Catatan Tambahan
              </Label>
              <Textarea
                {...register("notes")}
                className="min-h-15 text-xs"
                placeholder="Keterangan rute, supir, atau kendala lapangan..."
              />
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <RiLoaderLine className="size-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Ritase</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
