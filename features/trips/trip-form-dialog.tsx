/* eslint-disable react-hooks/incompatible-library */
"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  RiAddLine,
  RiCalculatorLine,
  RiInformationLine,
  RiLoaderLine,
  RiRefreshLine,
  RiTruckLine,
} from "@remixicon/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { format } from "date-fns"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

import { createTrip, updateTrip } from "@/features/trips/trips.actions"
import { createTripSchema } from "@/features/trips/trips.schema"
import {
  cn,
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/utils"
import { calculateOmset } from "@/domain/calculators/omset"
import { calculateSangu } from "@/domain/calculators/sangu"
import { calculateTripProfit } from "@/domain/calculators/trip-profit"

import {
  TripDestinationCombobox,
  type RateReferenceRecord,
} from "./trip-destination-combobox"
import type { CreateTripInput } from "./trips.schema"
import type { TripRecord } from "@/features/trips/trips-table"

function normalizeStatus(status?: string | null): string {
  if (!status) return ""
  const s = status.toLowerCase()
  if (s.includes("lunas") || s.includes("sudah") || s.includes("sdh")) {
    return "Lunas"
  }
  if (s.includes("belum")) {
    return "Belum Bayar"
  }
  return status === "Lunas" || status === "Belum Bayar" ? status : ""
}

interface TripFormDialogProps {
  mode?: "create" | "edit"
  trip?: TripRecord
  rateReferences: RateReferenceRecord[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

export function TripFormDialog({
  mode = "create",
  trip,
  rateReferences,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: TripFormDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = React.useCallback(
    (val: boolean) => {
      if (isControlled) {
        controlledOnOpenChange?.(val)
      } else {
        setInternalOpen(val)
      }
    },
    [isControlled, controlledOnOpenChange]
  )
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [orderDateOpen, setOrderDateOpen] = React.useState(false)
  const [unloadingDateOpen, setUnloadingDateOpen] = React.useState(false)

  // Internal rate reference calculation states
  const [selectedRate, setSelectedRate] =
    React.useState<RateReferenceRecord | null>(null)
  const [selectedRateId, setSelectedRateId] = React.useState<string | null>(
    null
  )
  const [sanguPercentage, setSanguPercentage] = React.useState<number>(0.52)
  const [hasSpecialDeductions, setHasSpecialDeductions] =
    React.useState<boolean>(false)
  const [isSanguManuallyEdited, setIsSanguManuallyEdited] =
    React.useState<boolean>(false)

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
      truckId: "" as unknown as "W8187UA" | "H8133OF",
      orderNumber: "",
      orderDate: "",
      unloadingDate: "",
      destinationCity: "",
      destinationName: "",
      ratePerTon: "",
      loadedTonnage: "",
      unloadedTonnage: "",
      omset: "0.00",
      sangu: "",
      profit: "0.00",
      incentiveRate: "35000.00",
      incentivePaid: "",
      thirdPartyFee: "",
      tax1Pct: "0.00",
      deduction2PctLju: "0.00",
      deduction5PctUjGrb: "0.00",
      mealAllowance: "0.00",
      savings: "0.00",
      claim: "0.00",
      claimDriver: "0.00",
      notes: "",
      thirdPartyName: "SILOG - Mas Wawan",
    },
  })

  // Set default values when edit or reset on create
  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && trip) {
        reset({
          truckId: trip.truckId as "W8187UA" | "H8133OF",
          orderNumber: trip.orderNumber ?? "",
          orderDate: trip.orderDate ?? "",
          unloadingDate: trip.unloadingDate ?? "",
          rateReferenceId: trip.rateReferenceId,
          destinationCity: trip.destinationCity ?? "",
          destinationName: trip.destinationName ?? "",
          ratePerTon: trip.ratePerTon?.toString() ?? "",
          loadedTonnage: trip.loadedTonnage?.toString() ?? "",
          unloadedTonnage: trip.unloadingDate
            ? (trip.unloadedTonnage?.toString() ?? "")
            : "",
          omset: trip.omset?.toString() ?? "0.00",
          sangu: trip.sangu?.toString() ?? "",
          profit: trip.profit?.toString() ?? "0.00",
          incentiveRate: trip.incentiveRate?.toString() ?? "35000.00",
          incentivePaid:
            trip.incentivePaid && parseFloat(trip.incentivePaid) > 0
              ? trip.incentivePaid.toString()
              : "",
          thirdPartyFee:
            trip.thirdPartyFee && parseFloat(trip.thirdPartyFee) > 0
              ? trip.thirdPartyFee
              : "",
          tax1Pct: trip.tax1Pct?.toString() ?? "0.00",
          deduction2PctLju: trip.deduction2PctLju?.toString() ?? "0.00",
          deduction5PctUjGrb: trip.deduction5PctUjGrb?.toString() ?? "0.00",
          mealAllowance: trip.mealAllowance?.toString() ?? "0.00",
          savings: trip.savings?.toString() ?? "0.00",
          claim: trip.claim?.toString() ?? "0.00",
          claimDriver: trip.claimDriver?.toString() ?? "0.00",
          notes: trip.notes ?? "",
          incentiveStatus: normalizeStatus(trip.incentiveStatus),
          thirdPartyName: trip.thirdPartyName ?? "",
          thirdPartyStatus: normalizeStatus(trip.thirdPartyStatus),
        })
        setSelectedRateId(trip.rateReferenceId ?? null)

        const ref = rateReferences.find((r) => r.id === trip.rateReferenceId)
        if (ref) {
          setSelectedRate(ref)
          setSanguPercentage(parseFloat(ref.sanguPercentage))
          setHasSpecialDeductions(ref.hasSpecialDeductions)
        }
        setIsSanguManuallyEdited(true)
      } else if (mode === "create") {
        reset({
          truckId: "" as unknown as "W8187UA" | "H8133OF",
          orderNumber: undefined as unknown as number,
          orderDate: "",
          unloadingDate: "",
          rateReferenceId: undefined,
          destinationCity: "",
          destinationName: "",
          ratePerTon: "",
          loadedTonnage: "",
          unloadedTonnage: "",
          omset: "0.00",
          sangu: "",
          profit: "0.00",
          incentiveRate: "35000.00",
          incentivePaid: "",
          thirdPartyFee: "",
          tax1Pct: "0.00",
          deduction2PctLju: "0.00",
          deduction5PctUjGrb: "0.00",
          mealAllowance: "0.00",
          savings: "0.00",
          claim: "0.00",
          claimDriver: "0.00",
          notes: "",
          incentiveStatus: "",
          thirdPartyName: "",
          thirdPartyStatus: "",
        })
        setSelectedRate(null)
        setSelectedRateId(null)
        setSanguPercentage(0.52)
        setHasSpecialDeductions(false)
        setIsSanguManuallyEdited(false)
      }
    }
  }, [open, mode, trip, reset, rateReferences])

  // Watch fields for live reactive calculation
  const watchedTruckId = watch("truckId")
  const watchedOrderDate = watch("orderDate")
  const watchedUnloadingDate = watch("unloadingDate")
  const watchedRatePerTon = watch("ratePerTon")
  const watchedLoadedTonnage = watch("loadedTonnage")
  const watchedUnloadedTonnage = watch("unloadedTonnage")
  const watchedSangu = watch("sangu")
  const watchedThirdPartyFee = watch("thirdPartyFee")
  const watchedThirdPartyName = watch("thirdPartyName")
  const watchedThirdPartyStatus = watch("thirdPartyStatus")
  const watchedIncentiveStatus = watch("incentiveStatus")
  const watchedIncentivePaid = watch("incentivePaid")
  const watchedMealAllowance = watch("mealAllowance")
  const watchedSavings = watch("savings")
  const watchedClaim = watch("claim")
  const watchedClaimDriver = watch("claimDriver")

  // Determine if currently selected route is Indocement
  const isIndocement = React.useMemo(() => {
    if (!selectedRate) return false
    const plant = (selectedRate.originPlant || "").toLowerCase()
    const client = (selectedRate.clientName || "").toLowerCase()
    return (
      plant.includes("indocement") ||
      plant.includes("grobogan") ||
      client.includes("indocement") ||
      client.includes("grobogan")
    )
  }, [selectedRate])

  // Active tonnage determination:
  // 1. Jika Tanggal Bongkar terisi dan Tonase Bongkar sudah diisi (> 0), gunakan Tonase Bongkar (Final)
  // 2. Jika belum bongkar, gunakan Tonase Muat dari surat jalan pabrik (Sementara)
  // 3. Fallback jika keduanya belum diisi: 0
  const isUnloadingDateSelected = Boolean(
    watchedUnloadingDate && watchedUnloadingDate.trim()
  )
  const loadedTonnageNum = parseFloat(watchedLoadedTonnage ?? "0") || 0
  const unloadedTonnageNum = parseFloat(watchedUnloadedTonnage ?? "0") || 0
  const isBongkarFilled = isUnloadingDateSelected && unloadedTonnageNum > 0
  const activeTonnage = isBongkarFilled
    ? unloadedTonnageNum
    : loadedTonnageNum > 0
      ? loadedTonnageNum
      : 0
  const isUsingLoadedTonnage = !isBongkarFilled && loadedTonnageNum > 0

  // Selisih realisasi tonase (plus / minus dari tonase muat)
  const tonnageDifference =
    isUnloadingDateSelected && loadedTonnageNum > 0 && unloadedTonnageNum > 0
      ? Math.round((unloadedTonnageNum - loadedTonnageNum) * 100) / 100
      : null

  // Recommended sangu computation from reference/formula
  const recommendedSangu = React.useMemo(() => {
    if (
      selectedRate?.defaultSangu &&
      parseFloat(selectedRate.defaultSangu) > 0
    ) {
      return Math.round(parseFloat(selectedRate.defaultSangu))
    }
    const rateNum = parseFloat(watchedRatePerTon ?? "0") || 0
    const tonnageNum = activeTonnage > 0 ? activeTonnage : 0
    if (rateNum <= 0 || tonnageNum <= 0) return 0
    return calculateSangu({
      ratePerTon: rateNum,
      unloadedTonnage: tonnageNum,
      sanguPercentage,
    })
  }, [selectedRate, watchedRatePerTon, activeTonnage, sanguPercentage])

  // Sync recommended sangu to form only when route is selected and not manually edited
  React.useEffect(() => {
    if (!isSanguManuallyEdited && selectedRate && recommendedSangu > 0) {
      setValue("sangu", recommendedSangu.toString())
    }
  }, [recommendedSangu, isSanguManuallyEdited, selectedRate, setValue])

  // Live calculation effect for profit and deductions
  const liveCalc = React.useMemo(() => {
    const rateNum = parseFloat(watchedRatePerTon ?? "0") || 0
    const sanguNum = parseFloat(watchedSangu ?? "0") || 0
    const thirdPartyNum = parseFloat(watchedThirdPartyFee ?? "0") || 0
    const incentivePaidNum = parseFloat(watchedIncentivePaid ?? "0") || 0
    const mealNum = parseFloat(watchedMealAllowance ?? "0") || 0
    const savingsNum = parseFloat(watchedSavings ?? "0") || 0
    const claimNum = parseFloat(watchedClaim ?? "0") || 0
    const claimDriverNum = parseFloat(watchedClaimDriver ?? "0") || 0

    const omset = calculateOmset({
      ratePerTon: rateNum,
      unloadedTonnage: activeTonnage,
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
      sangu: sanguNum,
      incentivePaid: incentivePaidNum,
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
      sangu: sanguNum,
      tax1Pct,
      deduction2PctLju,
      deduction5PctUjGrb,
      profit: profitResult.profit,
    }
  }, [
    watchedRatePerTon,
    activeTonnage,
    watchedSangu,
    watchedIncentivePaid,
    watchedThirdPartyFee,
    watchedMealAllowance,
    watchedSavings,
    watchedClaim,
    watchedClaimDriver,
    hasSpecialDeductions,
  ])

  // Synchronize computed numbers with form values
  React.useEffect(() => {
    setValue("omset", liveCalc.omset.toFixed(2))
    setValue("profit", liveCalc.profit.toFixed(2))
    setValue("tax1Pct", liveCalc.tax1Pct.toFixed(2))
    setValue("deduction2PctLju", liveCalc.deduction2PctLju.toFixed(2))
    setValue("deduction5PctUjGrb", liveCalc.deduction5PctUjGrb.toFixed(2))
  }, [liveCalc, setValue])

  // Handle route selection from combobox
  function handleRouteSelect(rateRef: RateReferenceRecord) {
    setSelectedRate(rateRef)
    setSelectedRateId(rateRef.id)
    setValue("rateReferenceId", rateRef.id)
    setValue("destinationCity", rateRef.city)
    setValue("destinationName", rateRef.destination)
    setValue("ratePerTon", parseFloat(rateRef.ratePerTon).toString())
    setSanguPercentage(parseFloat(rateRef.sanguPercentage))
    setHasSpecialDeductions(rateRef.hasSpecialDeductions)

    setIsSanguManuallyEdited(false)
    let initialSangu = 0
    if (rateRef.defaultSangu && parseFloat(rateRef.defaultSangu) > 0) {
      initialSangu = Math.round(parseFloat(rateRef.defaultSangu))
    } else {
      const tonnageNum = activeTonnage > 0 ? activeTonnage : 31.0
      initialSangu = calculateSangu({
        ratePerTon: parseFloat(rateRef.ratePerTon) || 0,
        unloadedTonnage: tonnageNum,
        sanguPercentage: parseFloat(rateRef.sanguPercentage) || 0.52,
      })
    }
    setValue("sangu", initialSangu.toString())

    // Aturan Pihak Ketiga:
    // Jika selain Indocement: pasti SILOG - Mas Wawan dengan Biaya Rp 100.000.
    // Jika Indocement: manual input / fleksibel (modal sendiri, Mas Wawan, atau 5%).
    const plant = (rateRef.originPlant || "").toLowerCase()
    const client = (rateRef.clientName || "").toLowerCase()
    const isIndo =
      plant.includes("indocement") ||
      plant.includes("grobogan") ||
      client.includes("indocement") ||
      client.includes("grobogan")

    if (!isIndo) {
      setValue("thirdPartyName", "SILOG - Mas Wawan")
      setValue("thirdPartyFee", "100000")
    } else {
      setValue("thirdPartyName", "")
      setValue("thirdPartyFee", "")
    }
  }

  // Reset sangu to system recommendation
  function handleResetSanguToRecommendation() {
    setIsSanguManuallyEdited(false)
    setValue("sangu", recommendedSangu.toString())
  }

  // Handle form submission
  async function onSubmit(data: CreateTripInput) {
    setIsSubmitting(true)
    try {
      const effectiveUnloadedTonnage =
        data.unloadedTonnage && parseFloat(data.unloadedTonnage) > 0
          ? data.unloadedTonnage
          : data.loadedTonnage || "31.00"

      const payload: CreateTripInput = {
        ...data,
        loadedTonnage: data.loadedTonnage || undefined,
        unloadedTonnage: effectiveUnloadedTonnage,
        thirdPartyName:
          data.thirdPartyName?.trim() ||
          (!isIndocement ? "SILOG - Mas Wawan" : "-"),
        thirdPartyFee: data.thirdPartyFee ? data.thirdPartyFee : "0.00",
        incentivePaid: data.incentivePaid ? data.incentivePaid : "0.00",
        thirdPartyStatus: data.thirdPartyStatus?.trim() || undefined,
        incentiveStatus: data.incentiveStatus?.trim() || undefined,
        unloadingDate: data.unloadingDate || undefined,
      }

      if (mode === "create") {
        const res = await createTrip(payload)
        if (res.success) {
          toast.success("Surat jalan ritase berhasil disimpan ke database!")
          setOpen(false)
          reset()
          setSelectedRate(null)
          setSelectedRateId(null)
          setIsSanguManuallyEdited(false)
        } else {
          toast.error(res.error || "Gagal menyimpan ritase.")
        }
      } else {
        if (!trip?.id) {
          toast.error("ID surat jalan tidak ditemukan.")
          return
        }
        const res = await updateTrip({
          ...payload,
          id: trip.id,
        })
        if (res.success) {
          toast.success("Surat jalan ritase berhasil diperbarui!")
          setOpen(false)
        } else {
          toast.error(res.error || "Gagal memperbarui ritase.")
        }
      }
    } catch {
      toast.error("Terjadi kendala jaringan saat menyimpan ritase.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {showTrigger && (
        <Button
          id="btn-input-trip"
          size="sm"
          onClick={() => setOpen(true)}
          className="h-9 w-full gap-1.5 px-4 font-medium shadow-sm sm:w-auto"
        >
          <RiAddLine className="size-4" />
          <span>Tambah Ritase Baru</span>
        </Button>
      )}

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiTruckLine className="size-4" />
            </div>
            <span>
              {mode === "create" ? "Tambah Ritase Baru" : "Edit Ritase"}
            </span>
          </div>
        }
        description={
          mode === "create"
            ? "Catat order pengiriman semen curah. Tarif dan uang sangu supir terhitung otomatis."
            : `Perbarui data ritase untuk order #${trip?.orderNumber}`
        }
        className="sm:max-w-2xl lg:max-w-3xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Baris 1: Unit Armada (Full Width) */}
          <div className="space-y-1.5">
            <Label htmlFor="truckId" className="text-xs font-semibold">
              Unit Armada <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watchedTruckId || null}
              onValueChange={(val) => {
                setValue("truckId", val as "W8187UA" | "H8133OF", {
                  shouldValidate: true,
                })
              }}
            >
              <SelectTrigger id="truckId" className="h-9! w-full text-xs">
                <SelectValue placeholder="Pilih unit armada" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="W8187UA" className="text-xs">
                  Triyono - W 8187 UA
                </SelectItem>
                <SelectItem value="H8133OF" className="text-xs">
                  Khoirul - H 8133 OF
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.truckId && (
              <p className="text-[11px] text-destructive">
                {errors.truckId.message}
              </p>
            )}
          </div>

          {/* Baris 2: Nomor Order / Surat Jalan & Tanggal Order (2 Kolom) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="orderNumber" className="text-xs font-semibold">
                  Nomor Order / Surat Jalan{" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="orderNumber"
                type="text"
                {...register("orderNumber")}
                className="h-9! font-mono text-xs font-medium uppercase"
                placeholder="mis. 7911-ZLF-2014002386"
              />
              {errors.orderNumber && (
                <p className="text-[11px] text-destructive">
                  {errors.orderNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label className="text-xs font-semibold">
                  Tanggal Order <span className="text-destructive">*</span>
                </Label>
              </div>
              <Popover open={orderDateOpen} onOpenChange={setOrderDateOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-9! w-full justify-start text-left text-xs font-normal",
                        !watchedOrderDate && "text-muted-foreground"
                      )}
                    >
                      {watchedOrderDate ? (
                        format(new Date(watchedOrderDate), "dd/MM/yyyy")
                      ) : (
                        <span>mis. 23/09/2026</span>
                      )}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      watchedOrderDate ? new Date(watchedOrderDate) : undefined
                    }
                    onSelect={(d) => {
                      setValue("orderDate", d ? format(d, "yyyy-MM-dd") : "", {
                        shouldValidate: true,
                      })
                      setOrderDateOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
              {errors.orderDate && (
                <p className="text-[11px] text-destructive">
                  {errors.orderDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Baris 3: Rute / Tujuan Pabrik (Full Width Combobox) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">
                Rute / Tujuan Pabrik <span className="text-destructive">*</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">
                Pilih dari {rateReferences.length} rute acuan
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

          {/* Baris 4: Tarif / Ton & Tonase Muat (Surat Pabrik) (2 Kolom) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="ratePerTon" className="text-xs font-semibold">
                  Tarif / Ton <span className="text-destructive">*</span>
                </Label>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="ratePerTon"
                  type="text"
                  inputMode="decimal"
                  value={formatCurrencyInput(watchedRatePerTon || "")}
                  onChange={(e) => {
                    setValue("ratePerTon", parseCurrencyInput(e.target.value), {
                      shouldValidate: true,
                    })
                  }}
                  className="h-9! pl-9 text-xs font-medium"
                  placeholder="mis. 95.000"
                />
              </div>
              {errors.ratePerTon && (
                <p className="text-[11px] text-destructive">
                  {errors.ratePerTon.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="loadedTonnage"
                  className="text-xs font-semibold"
                >
                  Tonase Muatan <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Surat Pabrik
                </span>
              </div>
              <div className="relative">
                <Input
                  id="loadedTonnage"
                  type="number"
                  step="any"
                  {...register("loadedTonnage", {
                    required: "Tonase muat wajib diisi (dari surat pabrik)",
                  })}
                  className="h-9! pr-12 text-xs font-medium"
                  placeholder="mis. 31.00"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Ton
                </span>
              </div>
              {errors.loadedTonnage && (
                <p className="text-[11px] text-destructive">
                  {errors.loadedTonnage.message}
                </p>
              )}
            </div>
          </div>

          {/* Baris 5: Tanggal Bongkar (Bagi Hasil) & Tonase Bongkar (Realisasi) (2 Kolom) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label className="text-xs font-semibold">Tanggal Bongkar</Label>
                <span className="text-[10px] text-muted-foreground">
                  (Bagi Hasil)
                </span>
              </div>
              <Popover
                open={unloadingDateOpen}
                onOpenChange={setUnloadingDateOpen}
              >
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-9! w-full justify-start text-left text-xs font-normal",
                        !watchedUnloadingDate && "text-muted-foreground"
                      )}
                    >
                      {watchedUnloadingDate ? (
                        format(new Date(watchedUnloadingDate), "dd/MM/yyyy")
                      ) : (
                        <span>mis. 23/09/2026</span>
                      )}
                    </Button>
                  }
                />
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      watchedUnloadingDate
                        ? new Date(watchedUnloadingDate)
                        : undefined
                    }
                    onSelect={(d) => {
                      const nextDate = d ? format(d, "yyyy-MM-dd") : ""
                      setValue("unloadingDate", nextDate, {
                        shouldValidate: true,
                      })
                      if (!nextDate) {
                        setValue("unloadedTonnage", "")
                      }
                      setUnloadingDateOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="unloadedTonnage"
                  className="text-xs font-semibold"
                >
                  Tonase Bongkar
                </Label>
                {tonnageDifference !== null ? (
                  <Badge
                    variant="outline"
                    className={cn(
                      "h-4 px-1 py-0 text-[9px] font-semibold",
                      tonnageDifference > 0
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : tonnageDifference < 0
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "border-border text-muted-foreground"
                    )}
                  >
                    {tonnageDifference > 0
                      ? `+${tonnageDifference.toFixed(2)}T (Plus)`
                      : tonnageDifference < 0
                        ? `${tonnageDifference.toFixed(2)}T (Susut)`
                        : "0.00T (Pas)"}
                  </Badge>
                ) : !isUnloadingDateSelected ? (
                  <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                    Isi tanggal bongkar terlebih dahulu
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground">
                    Masukkan tonase riil bongkar
                  </span>
                )}
              </div>
              <div className="relative">
                <Input
                  id="unloadedTonnage"
                  type="number"
                  step="any"
                  disabled={!isUnloadingDateSelected}
                  {...register("unloadedTonnage")}
                  className={cn(
                    "h-9! pr-12 text-xs font-medium",
                    !isUnloadingDateSelected &&
                      "cursor-not-allowed bg-muted/60 text-muted-foreground/60"
                  )}
                  placeholder={isUnloadingDateSelected ? "mis. 31.00" : "-"}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Ton
                </span>
              </div>
              {errors.unloadedTonnage && (
                <p className="text-[11px] text-destructive">
                  {errors.unloadedTonnage.message}
                </p>
              )}
            </div>
          </div>

          {/* Baris 6: Sangu Supir / Uang Jalan (Box Card Serasi) */}
          <div className="space-y-2.5 rounded-lg border border-border/80 bg-muted/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <Label htmlFor="sangu" className="text-xs font-semibold">
                  Sangu Supir / Uang Jalan{" "}
                  <span className="text-destructive">*</span>
                </Label>
                {selectedRate &&
                  (isSanguManuallyEdited ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-[9px] font-medium text-amber-600 dark:text-amber-400"
                    >
                      Disesuaikan Manual
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-[9px] font-medium text-emerald-600 dark:text-emerald-400"
                    >
                      Acuan Sistem
                    </Badge>
                  ))}
              </div>
              {isSanguManuallyEdited && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetSanguToRecommendation}
                  className="h-6 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground"
                  title="Kembalikan nilai sangu ke rekomendasi acuan rute"
                >
                  <RiRefreshLine className="size-3" />
                  <span>
                    Reset ke Acuan (
                    {recommendedSangu > 0
                      ? formatCurrency(recommendedSangu)
                      : "Rp -"}
                    )
                  </span>
                </Button>
              )}
            </div>

            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                id="sangu"
                type="text"
                inputMode="decimal"
                value={formatCurrencyInput(watchedSangu || "")}
                onChange={(e) => {
                  setIsSanguManuallyEdited(true)
                  setValue("sangu", parseCurrencyInput(e.target.value), {
                    shouldValidate: true,
                  })
                }}
                className="h-9! pl-9 font-mono text-xs font-semibold text-amber-600 dark:text-amber-400"
                placeholder="mis. 1.531.000"
              />
            </div>
            {errors.sangu && (
              <p className="text-[11px] text-destructive">
                {errors.sangu.message}
              </p>
            )}

            {selectedRate && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {selectedRate.defaultSangu &&
                parseFloat(selectedRate.defaultSangu) > 0
                  ? `Standar UJ rute ini: ${formatCurrency(parseFloat(selectedRate.defaultSangu))}. Dapat disesuaikan jika muatan > 31 ton.`
                  : `Estimasi acuan sangu: ${Math.round(sanguPercentage * 100)}% (basis maks 31T: ${recommendedSangu > 0 ? formatCurrency(recommendedSangu) : "Rp -"}). Dapat disesuaikan jika muatan > 31 ton.`}
              </p>
            )}
          </div>

          {/* Baris 7: Card Kalkulasi Otomatis (Live) */}
          <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <RiCalculatorLine className="size-4" />
                <span>Kalkulasi Otomatis (Live)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-primary/10 pt-1 text-center">
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  Omset Bruto{" "}
                  {isUsingLoadedTonnage ? (
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      (Sementara)
                    </span>
                  ) : isBongkarFilled ? (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      (Bongkar)
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-sm font-bold">
                  {liveCalc.omset > 0 ? formatCurrency(liveCalc.omset) : "Rp -"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  Sangu Supir {isSanguManuallyEdited ? "(Manual)" : "(Acuan)"}
                </span>
                <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                  {liveCalc.sangu > 0 ? formatCurrency(liveCalc.sangu) : "Rp -"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  Laba Ritase
                </span>
                <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {liveCalc.profit !== 0
                    ? formatCurrency(liveCalc.profit)
                    : "Rp -"}
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
                  {liveCalc.omset > 0
                    ? formatCurrency(
                        liveCalc.tax1Pct +
                          liveCalc.deduction2PctLju +
                          liveCalc.deduction5PctUjGrb
                      )
                    : "Rp -"}
                </span>
              </div>
            )}
          </div>

          {/* Baris 8: Biaya Pihak Ketiga & Nama Pihak Ketiga (2 Kolom) */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex h-5 items-center justify-between">
                  <Label
                    htmlFor="thirdPartyFee"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Biaya Pihak Ketiga / DO
                  </Label>
                  {selectedRate && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-5 py-0 text-[10px] font-medium",
                        !isIndocement
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {!isIndocement
                        ? "Otomatis Rp 100.000"
                        : "Manual / Pilihan"}
                    </Badge>
                  )}
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    id="thirdPartyFee"
                    type="text"
                    inputMode="decimal"
                    value={formatCurrencyInput(watchedThirdPartyFee || "")}
                    readOnly={!isIndocement && !!selectedRate}
                    disabled={!isIndocement && !!selectedRate}
                    onChange={(e) => {
                      setValue(
                        "thirdPartyFee",
                        parseCurrencyInput(e.target.value)
                      )
                    }}
                    className={cn(
                      "h-9! pl-9 text-xs font-medium",
                      !isIndocement &&
                        !!selectedRate &&
                        "cursor-not-allowed bg-muted/60 text-muted-foreground"
                    )}
                    placeholder={
                      !isIndocement && !!selectedRate ? "100.000" : "mis. 0"
                    }
                  />
                </div>
                {!isIndocement && !!selectedRate && (
                  <p className="text-[10.5px] text-muted-foreground">
                    Pabrik selain Indocement pasti oleh SILOG - Mas Wawan dengan
                    fee tetap Rp 100.000.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex h-5 items-center justify-between">
                  <Label
                    htmlFor="thirdPartyName"
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    Nama Pihak Ketiga
                  </Label>
                </div>
                <Input
                  id="thirdPartyName"
                  type="text"
                  value={watchedThirdPartyName ?? ""}
                  readOnly={!isIndocement && !!selectedRate}
                  disabled={!isIndocement && !!selectedRate}
                  onChange={(e) => setValue("thirdPartyName", e.target.value)}
                  className={cn(
                    "h-9! text-xs font-medium",
                    !isIndocement &&
                      !!selectedRate &&
                      "cursor-not-allowed bg-muted/60 text-muted-foreground"
                  )}
                  placeholder="mis. SILOG - Mas Wawan"
                />
              </div>
            </div>

            {/* Pilihan Cepat Biaya khusus rute Indocement */}
            {isIndocement && (
              <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-foreground">
                    Pilihan Biaya DO Indocement:
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Dapat modal sendiri atau ditalangi pihak lain
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                  <Button
                    type="button"
                    variant={
                      watchedThirdPartyFee === "100000" &&
                      watchedThirdPartyName === "SILOG - Mas Wawan"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      setValue("thirdPartyName", "SILOG - Mas Wawan")
                      setValue("thirdPartyFee", "100000")
                    }}
                    className="h-7 px-1 text-[10px] font-normal sm:px-2.5 sm:text-[11px]"
                  >
                    <span className="truncate sm:hidden">Mas Wawan</span>
                    <span className="hidden sm:inline">
                      Mas Wawan (Rp 100.000)
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant={
                      watchedThirdPartyName?.includes("5%") ||
                      (liveCalc.omset > 0 &&
                        watchedThirdPartyFee ===
                          Math.round(liveCalc.omset * 0.05).toString())
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      const fee5Pct = Math.round(liveCalc.omset * 0.05)
                      setValue("thirdPartyName", "Talangan Pihak Ketiga (5%)")
                      setValue("thirdPartyFee", fee5Pct.toString())
                    }}
                    className="h-7 px-1 text-[10px] font-normal sm:px-2.5 sm:text-[11px]"
                  >
                    <span className="truncate sm:hidden">Biaya 5%</span>
                    <span className="hidden sm:inline">
                      Biaya 5%{" "}
                      {liveCalc.omset > 0
                        ? `(${formatCurrency(Math.round(liveCalc.omset * 0.05))})`
                        : "(5% Omset)"}
                    </span>
                  </Button>
                  <Button
                    type="button"
                    variant={
                      watchedThirdPartyFee === "0" &&
                      (watchedThirdPartyName === "Modal Sendiri" ||
                        watchedThirdPartyName === "-")
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => {
                      setValue("thirdPartyName", "Modal Sendiri")
                      setValue("thirdPartyFee", "0")
                    }}
                    className="h-7 px-1 text-[10px] font-normal sm:px-2.5 sm:text-[11px]"
                  >
                    <span className="truncate sm:hidden">Modal Sendiri</span>
                    <span className="hidden sm:inline">
                      Modal Sendiri (Rp 0)
                    </span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Baris 9: Status Pembayaran Biaya DO, Status Insentif Supir & Insentif Dibayarkan (3 Kolom) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {/* Status Pembayaran Biaya DO */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="thirdPartyStatus"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Status Pembayaran Biaya DO
                </Label>
              </div>
              <Select
                value={watchedThirdPartyStatus || null}
                onValueChange={(val) => {
                  setValue("thirdPartyStatus", val ?? "", {
                    shouldValidate: true,
                  })
                }}
              >
                <SelectTrigger
                  id="thirdPartyStatus"
                  className="h-9! w-full text-xs"
                >
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Belum Bayar" className="text-xs">
                    Belum Bayar
                  </SelectItem>
                  <SelectItem value="Lunas" className="text-xs">
                    Lunas
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Insentif Supir */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="incentiveStatus"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Status Insentif Supir
                </Label>
              </div>
              <Select
                value={watchedIncentiveStatus || null}
                onValueChange={(val) => {
                  setValue("incentiveStatus", val ?? "", {
                    shouldValidate: true,
                  })
                }}
              >
                <SelectTrigger
                  id="incentiveStatus"
                  className="h-9! w-full text-xs"
                >
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Belum Bayar" className="text-xs">
                    Belum Bayar
                  </SelectItem>
                  <SelectItem value="Lunas" className="text-xs">
                    Lunas
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Insentif Dibayarkan */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="incentivePaid"
                  className="text-xs font-semibold text-muted-foreground"
                >
                  Insentif Dibayarkan
                </Label>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="incentivePaid"
                  type="text"
                  inputMode="decimal"
                  value={formatCurrencyInput(watchedIncentivePaid || "")}
                  onChange={(e) => {
                    const parsed = parseCurrencyInput(e.target.value)
                    setValue("incentivePaid", parsed, { shouldValidate: true })
                  }}
                  className="h-9! pl-9 text-xs font-medium"
                  placeholder="mis. 0"
                />
              </div>
              {selectedRate && (
                <p className="text-[11px] text-muted-foreground">
                  {parseFloat(selectedRate.additionalTonnageRate || "0") > 0 ? (
                    <>
                      Tarif Lebih Tonase:{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(
                          parseFloat(selectedRate.additionalTonnageRate)
                        )}
                        /ton
                      </span>
                    </>
                  ) : (
                    "Tarif lebih tonase: Rp 0/ton"
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Baris 10: Catatan Tambahan (Full Width) */}
          <div className="space-y-1.5">
            <Label
              htmlFor="notes"
              className="text-xs font-semibold text-muted-foreground"
            >
              Catatan Tambahan
            </Label>
            <Textarea
              id="notes"
              {...register("notes")}
              className="min-h-18 text-xs"
              placeholder="mis. Keterangan rute, supir, atau kendala lapangan..."
            />
          </div>

          {/* Footer: Tombol Batal & Simpan */}
          <div className="flex items-center justify-end gap-2 border-t px-2 pt-3 sm:px-0">
            <Button
              type="button"
              variant="outline"
              className="w-1/2 sm:w-36"
              size="lg"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="w-1/2 gap-1.5 sm:w-36"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RiLoaderLine className="size-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>
                  {mode === "create" ? "Simpan Ritase" : "Simpan Perubahan"}
                </span>
              )}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </>
  )
}
