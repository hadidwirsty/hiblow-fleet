"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  RiAddLine,
  RiCalculatorLine,
  RiPercentLine,
  RiPinDistanceLine,
  RiRouteLine,
} from "@remixicon/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import {
  createRateReference,
  updateRateReference,
} from "@/features/rates/rates.actions"
import {
  calculateIndocementParameters,
  isIndocementRoute,
} from "@/features/rates/rates.indocement"
import { rateFormSchema } from "@/features/rates/rates.schema"
import {
  cn,
  formatCityWithCode,
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/utils"
import { useUIStore } from "@/stores/theme"
import type { RateReference } from "@/db/schema"
import type { RateFormValues } from "@/features/rates/rates.schema"

export function resolveEditRateForLifecycle(
  rate: RateReference | null | undefined,
  cachedRate: RateReference | null
): RateReference | null {
  return rate ?? cachedRate ?? null
}

interface RateFormDialogProps {
  mode?: "create" | "edit"
  rate?: RateReference | null
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  distinctOriginPlants?: string[]
}

const PLANT_CHOICES = [
  {
    label: "SI - Tuban",
    value: "Semen Indonesia (SI) - Tuban",
  },
  {
    label: "SI - Rembang",
    value: "Semen Indonesia (SI) - Rembang",
  },
  {
    label: "SBI - Tuban",
    value: "Solusi Bangun Indonesia (SBI) - Tuban",
  },
  {
    label: "Indocement - Grobogan",
    value: "Indocement - Grobogan",
  },
]

const DEFAULT_ORIGIN_PLANTS = PLANT_CHOICES.map((p) => p.value)

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

  const [cachedRate, setCachedRate] = useState<RateReference | null>(
    rate ?? null
  )

  useEffect(() => {
    if (rate) {
      setCachedRate(rate)
    }
  }, [rate])

  const activeRate = resolveEditRateForLifecycle(rate, cachedRate)

  const { setModalSuccess } = useUIStore()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isManualSangu, setIsManualSangu] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm<RateFormValues>({
    resolver: zodResolver(rateFormSchema),
    defaultValues: {
      originPlant: "",
      clientName: "",
      city: "",
      cityCode: "",
      zoneCode: "",
      destination: "",
      distanceKm: "",
      saving5Percent: "",
      deduction2Percent: "",
      ljuDeduction: "",
      oaDriver: "",
      estimatedRevenue: "",
      estimatedProfitBase: "",
      totalSaving: "",
      estimatedProfitTotal: "",
      ratePerTon: "",
      standardTonnage: "",
      sanguPercentage: "",
      defaultSangu: "",
      additionalTonnageRate: "",
      useAdditionalPercentage: false,
      additionalPercentage: "",
      hasSpecialDeductions: false,
      isActive: true,
    },
  })

  // Watch field values for dynamic preview & live calculations
  /* eslint-disable react-hooks/incompatible-library */
  const watchedOriginPlant = watch("originPlant")
  const watchedRatePerTon = watch("ratePerTon")
  const watchedStandardTonnage = watch("standardTonnage")
  const watchedSanguPercentage = watch("sanguPercentage")
  const watchedDefaultSangu = watch("defaultSangu")
  const watchedAdditionalTonnageRate = watch("additionalTonnageRate")
  const watchedUseAdditionalPercentage = watch("useAdditionalPercentage")
  const watchedAdditionalPercentage = watch("additionalPercentage")
  const watchedIsActive = watch("isActive")
  const watchedSaving5Percent = watch("saving5Percent")
  const watchedDeduction2Percent = watch("deduction2Percent")
  const watchedLjuDeduction = watch("ljuDeduction")
  const watchedOaDriver = watch("oaDriver")
  const watchedEstimatedRevenue = watch("estimatedRevenue")
  const watchedEstimatedProfitBase = watch("estimatedProfitBase")
  const watchedTotalSaving = watch("totalSaving")
  const watchedEstimatedProfitTotal = watch("estimatedProfitTotal")
  /* eslint-enable react-hooks/incompatible-library */

  const availableOriginPlants = [
    ...PLANT_CHOICES,
    ...distinctOriginPlants
      .filter((p) => !PLANT_CHOICES.some((c) => c.value === p))
      .map((p) => ({
        label: p
          .replace("Semen Indonesia (SI) - ", "SI ")
          .replace("Solusi Bangun Indonesia (SBI) - ", "SBI ")
          .replace("Indocement - ", ""),
        value: p,
      })),
  ]

  const isSBI =
    Boolean(watchedOriginPlant) &&
    (watchedOriginPlant.toUpperCase().includes("SBI") ||
      watchedOriginPlant.toLowerCase().includes("solusi bangun"))

  const isIndocement = isIndocementRoute(watchedOriginPlant)

  const handlePlantChange = (val: string) => {
    setIsManualSangu(false)
    setValue("originPlant", val, { shouldValidate: true })

    const lower = val.toLowerCase()
    const upper = val.toUpperCase()

    if (upper.includes("SBI") || lower.includes("solusi bangun")) {
      setValue("clientName", "Solusi Bangun Indonesia (SBI) - Tuban")
      setValue("hasSpecialDeductions", false)
    } else if (lower.includes("grobogan") || lower.includes("indocement")) {
      setValue("clientName", "Indocement")
      setValue("hasSpecialDeductions", true)
    } else if (lower.includes("rembang")) {
      setValue("clientName", "Semen Indonesia - Rembang")
      setValue("cityCode", "")
      setValue("zoneCode", "")
      setValue("distanceKm", "")
      setValue("hasSpecialDeductions", false)
    } else if (lower.includes("tuban") && !upper.includes("SBI")) {
      setValue("clientName", "Semen Indonesia - Tuban")
      setValue("cityCode", "")
      setValue("zoneCode", "")
      setValue("distanceKm", "")
      setValue("hasSpecialDeductions", false)
    }
  }

  // Reset or pre-populate form on dialog open/close
  useEffect(() => {
    if (open) {
      if (mode === "edit" && activeRate) {
        const pctFromDb = activeRate.sanguPercentage
          ? parseFloat(activeRate.sanguPercentage) * 100
          : 52
        const roundedPct = Number(pctFromDb.toFixed(5))

        const numR = parseFloat(activeRate.ratePerTon) || 0
        const numT = parseFloat(activeRate.standardTonnage || "31") || 0
        const numP = parseFloat(activeRate.sanguPercentage) || 0
        const estJ = Math.round(numR * numT)
        const formS = Math.round(estJ * numP)
        const defS = activeRate.defaultSangu
          ? parseFloat(activeRate.defaultSangu)
          : 0
        const isLegacy =
          defS > 0 &&
          formS > 0 &&
          Math.abs(defS - Math.round(formS / 1000) * 1000) === 0 &&
          Math.abs(defS - formS) < 1000

        const isIndo = isIndocementRoute(activeRate)
        if (isIndo && activeRate.defaultSangu) {
          const autoCalc = calculateIndocementParameters({
            ratePerTon: numR,
            standardTonnage: numT > 0 ? numT : 31,
            sanguPercentage: pctFromDb,
          })
          setIsManualSangu(Math.abs(defS - autoCalc.uj31Ton) > 1)
        } else {
          setIsManualSangu(Boolean(activeRate.defaultSangu && !isLegacy))
        }

        const currentAddRate = parseFloat(
          activeRate.additionalTonnageRate ?? "0"
        )
        const roundedR = Math.round(numR)
        let isAddPct = false
        let addPctVal = ""
        if (roundedR > 0 && currentAddRate > 0) {
          const ratio = Math.round((currentAddRate / roundedR) * 100)
          if (
            Math.round(roundedR * (ratio / 100)) === Math.round(currentAddRate)
          ) {
            isAddPct = true
            addPctVal = ratio.toString()
          }
        }

        let initialCity = activeRate.city ?? ""
        let initialCityCode = activeRate.cityCode ?? ""
        if (
          !initialCityCode &&
          initialCity.includes("(") &&
          initialCity.includes(")")
        ) {
          const match = initialCity.match(/^(.*?)\s*\((.*?)\)$/)
          if (match) {
            initialCity = match[1].trim()
            initialCityCode = match[2].trim()
          }
        }

        const initialDistanceKm = activeRate.distanceKm
          ? parseFloat(activeRate.distanceKm).toString()
          : ""

        reset({
          originPlant: activeRate.originPlant ?? "",
          clientName: activeRate.clientName ?? "",
          city: initialCity,
          cityCode: initialCityCode,
          zoneCode: activeRate.zoneCode ?? "",
          destination: activeRate.destination ?? "",
          distanceKm: initialDistanceKm,
          saving5Percent: activeRate.saving5Percent ?? "",
          deduction2Percent: activeRate.deduction2Percent ?? "",
          ljuDeduction: activeRate.ljuDeduction ?? "",
          oaDriver: activeRate.oaDriver ?? "",
          estimatedRevenue: activeRate.estimatedRevenue ?? "",
          estimatedProfitBase: activeRate.estimatedProfitBase ?? "",
          totalSaving: activeRate.totalSaving ?? "",
          estimatedProfitTotal: activeRate.estimatedProfitTotal ?? "",
          ratePerTon: activeRate.ratePerTon ?? "",
          standardTonnage: activeRate.standardTonnage ?? "",
          sanguPercentage: roundedPct.toString().replace(".", ","),
          defaultSangu: isLegacy ? "" : (activeRate.defaultSangu ?? ""),
          additionalTonnageRate: activeRate.additionalTonnageRate ?? "",
          useAdditionalPercentage: isAddPct,
          additionalPercentage: addPctVal,
          hasSpecialDeductions: isIndocementRoute(activeRate),
          isActive: activeRate.isActive ?? true,
        })
      } else if (mode === "create") {
        setIsManualSangu(false)
        reset({
          originPlant: "",
          clientName: "",
          city: "",
          cityCode: "",
          zoneCode: "",
          destination: "",
          distanceKm: "",
          saving5Percent: "",
          deduction2Percent: "",
          ljuDeduction: "",
          oaDriver: "",
          estimatedRevenue: "",
          estimatedProfitBase: "",
          totalSaving: "",
          estimatedProfitTotal: "",
          ratePerTon: "",
          standardTonnage: "",
          sanguPercentage: "",
          defaultSangu: "",
          additionalTonnageRate: "",
          useAdditionalPercentage: false,
          additionalPercentage: "",
          hasSpecialDeductions: false,
          isActive: true,
        })
      }
      setError(null)
    }
  }, [open, mode, activeRate, reset])

  const numRate = parseFloat(watchedRatePerTon || "0") || 0
  const numTon = parseFloat(watchedStandardTonnage || "0") || 0
  const cleanPctStr = (watchedSanguPercentage || "").replace(",", ".").trim()
  const numPct = (parseFloat(cleanPctStr) || 0) / 100

  // Sinkronisasi otomatis Tarif Lebih Tonase jika mode persentase aktif
  useEffect(() => {
    if (watchedUseAdditionalPercentage && numRate > 0) {
      const pct = parseFloat(watchedAdditionalPercentage || "30") || 30
      const roundedTarif = Math.round(numRate)
      const autoRate = Math.round(roundedTarif * (pct / 100))
      setValue("additionalTonnageRate", autoRate.toString(), {
        shouldValidate: true,
      })
    }
  }, [
    watchedUseAdditionalPercentage,
    watchedAdditionalPercentage,
    numRate,
    setValue,
  ])

  // Kalkulasi otomatis untuk rute Indocement - Grobogan saat input hulu berubah
  useEffect(() => {
    if (!isIndocement || numRate <= 0) return

    const effectiveTonnage = numTon > 0 ? numTon : 31
    const pctVal = parseFloat(cleanPctStr) || 0

    const calc = calculateIndocementParameters({
      ratePerTon: numRate,
      standardTonnage: effectiveTonnage,
      sanguPercentage: pctVal,
      overrideSangu:
        isManualSangu && watchedDefaultSangu
          ? parseFloat(watchedDefaultSangu)
          : undefined,
    })

    setValue("saving5Percent", calc.saving5Percent.toString())
    setValue("deduction2Percent", calc.deduction2Percent.toString())
    setValue("ljuDeduction", calc.ljuDeduction.toString())
    setValue("oaDriver", calc.oaDriver.toString())
    setValue("estimatedRevenue", calc.estimatedRevenue.toString())
    setValue("estimatedProfitBase", calc.estimatedProfitBase.toString())
    setValue("totalSaving", calc.totalSaving.toString())
    setValue("estimatedProfitTotal", calc.estimatedProfitTotal.toString())

    if (!isManualSangu) {
      if (calc.uj31Ton > 0) {
        if (getValues("defaultSangu") !== calc.uj31Ton.toString()) {
          setValue("defaultSangu", calc.uj31Ton.toString())
        }
      } else if (!cleanPctStr) {
        if (getValues("defaultSangu") !== "") {
          setValue("defaultSangu", "")
        }
      }
    }
  }, [
    isIndocement,
    numRate,
    numTon,
    cleanPctStr,
    isManualSangu,
    watchedDefaultSangu,
    setValue,
    getValues,
  ])

  // 1. Rumus: Jumlah = Tarif x Tonase (dibulatkan)
  const estimatedJumlah =
    numRate > 0 && numTon > 0 ? Math.round(numRate * numTon) : 0

  // 2. Rumus: Sangu Supir = Estimasi Jumlah x % yang diinputkan (dibulatkan)
  const formulaSangu =
    numPct > 0 && estimatedJumlah > 0 ? Math.round(estimatedJumlah * numPct) : 0

  const parsedDefaultSangu = watchedDefaultSangu
    ? parseFloat(watchedDefaultSangu)
    : 0
  const isLegacyThousandRounding =
    parsedDefaultSangu > 0 &&
    formulaSangu > 0 &&
    Math.abs(parsedDefaultSangu - Math.round(formulaSangu / 1000) * 1000) ===
      0 &&
    Math.abs(parsedDefaultSangu - formulaSangu) < 1000

  const effectiveSangu =
    parsedDefaultSangu > 0 && !isLegacyThousandRounding
      ? parsedDefaultSangu
      : formulaSangu

  // 3. Rumus: Profit = Jumlah - Sangu Supir
  const estimatedProfit =
    estimatedJumlah > 0 ? estimatedJumlah - effectiveSangu : 0

  const onSubmit = async (values: RateFormValues) => {
    setError(null)
    setIsPending(true)

    const cleanPct = values.sanguPercentage.replace(",", ".").trim()
    const decimalSangu = cleanPct
      ? (parseFloat(cleanPct) / 100).toFixed(7)
      : "0.5200000"
    const cleanRatePerTon = values.ratePerTon.endsWith(".")
      ? values.ratePerTon.slice(0, -1)
      : values.ratePerTon
    const cleanAdditionalTonnageRate = (
      values.additionalTonnageRate || "0.00"
    ).endsWith(".")
      ? (values.additionalTonnageRate || "0.00").slice(0, -1)
      : values.additionalTonnageRate || "0.00"

    const derivedClientName =
      values.clientName ||
      (values.originPlant.includes("SBI") ||
      values.originPlant.toLowerCase().includes("solusi bangun")
        ? "Solusi Bangun Indonesia (SBI) - Tuban"
        : values.originPlant.includes("Grobogan") ||
            values.originPlant.toLowerCase().includes("indocement")
          ? "Indocement"
          : values.originPlant.includes("Rembang")
            ? "Semen Indonesia - Rembang"
            : "Semen Indonesia - Tuban")

    const cleanDefaultSangu = values.defaultSangu
      ? values.defaultSangu.endsWith(".")
        ? values.defaultSangu.slice(0, -1)
        : values.defaultSangu
      : undefined

    const finalStandardTonnage = values.standardTonnage || "31.00"

    const cleanCityCode =
      (isSBI || isIndocement) && values.cityCode
        ? values.cityCode.toUpperCase().trim()
        : null
    const cleanZoneCode =
      isIndocement && values.zoneCode
        ? values.zoneCode.toUpperCase().trim()
        : null
    const cleanDistanceKm =
      isSBI && values.distanceKm
        ? values.distanceKm.replace(",", ".").trim()
        : null

    const cleanSaving5Percent =
      isIndocement && values.saving5Percent
        ? values.saving5Percent.replace(",", ".").trim()
        : null
    const cleanDeduction2Percent =
      isIndocement && values.deduction2Percent
        ? values.deduction2Percent.replace(",", ".").trim()
        : null
    const cleanLjuDeduction =
      isIndocement && values.ljuDeduction
        ? values.ljuDeduction.replace(",", ".").trim()
        : null
    const cleanOaDriver =
      isIndocement && values.oaDriver
        ? values.oaDriver.replace(",", ".").trim()
        : null
    const cleanEstimatedRevenue =
      isIndocement && values.estimatedRevenue
        ? values.estimatedRevenue.replace(",", ".").trim()
        : null
    const cleanEstimatedProfitBase =
      isIndocement && values.estimatedProfitBase
        ? values.estimatedProfitBase.replace(",", ".").trim()
        : null
    const cleanTotalSaving =
      isIndocement && values.totalSaving
        ? values.totalSaving.replace(",", ".").trim()
        : null
    const cleanEstimatedProfitTotal =
      isIndocement && values.estimatedProfitTotal
        ? values.estimatedProfitTotal.replace(",", ".").trim()
        : null

    const formattedCityPreview = formatCityWithCode(
      values.city.toUpperCase().trim(),
      cleanCityCode
    )

    const finalHasSpecialDeductions = isIndocementRoute(values.originPlant)

    try {
      if (mode === "create") {
        const res = await createRateReference({
          originPlant: values.originPlant.trim(),
          clientName: derivedClientName,
          city: values.city.toUpperCase().trim(),
          cityCode: cleanCityCode,
          zoneCode: cleanZoneCode,
          destination: values.destination.toUpperCase().trim(),
          distanceKm: cleanDistanceKm,
          saving5Percent: cleanSaving5Percent,
          deduction2Percent: cleanDeduction2Percent,
          ljuDeduction: cleanLjuDeduction,
          oaDriver: cleanOaDriver,
          estimatedRevenue: cleanEstimatedRevenue,
          estimatedProfitBase: cleanEstimatedProfitBase,
          totalSaving: cleanTotalSaving,
          estimatedProfitTotal: cleanEstimatedProfitTotal,
          ratePerTon: cleanRatePerTon,
          standardTonnage: finalStandardTonnage,
          sanguPercentage: decimalSangu,
          defaultSangu: cleanDefaultSangu,
          additionalTonnageRate: cleanAdditionalTonnageRate,
          hasSpecialDeductions: finalHasSpecialDeductions,
          isActive: values.isActive,
        })

        if (res.success) {
          toast.success("Referensi tarif rute baru berhasil disimpan")
          setOpen(false)
          reset()
          setModalSuccess({
            open: true,
            title: "Rute Berhasil Ditambahkan",
            message: `Referensi tarif rute ${values.destination} (${formattedCityPreview}) berhasil disimpan ke sistem.`,
            actionMessage: "Selesai",
          })
        } else {
          setError(res.error)
        }
      } else if (mode === "edit" && activeRate) {
        const res = await updateRateReference({
          id: activeRate.id,
          originPlant: values.originPlant.trim(),
          clientName: derivedClientName,
          city: values.city.toUpperCase().trim(),
          cityCode: cleanCityCode,
          zoneCode: cleanZoneCode,
          destination: values.destination.toUpperCase().trim(),
          distanceKm: cleanDistanceKm,
          saving5Percent: cleanSaving5Percent,
          deduction2Percent: cleanDeduction2Percent,
          ljuDeduction: cleanLjuDeduction,
          oaDriver: cleanOaDriver,
          estimatedRevenue: cleanEstimatedRevenue,
          estimatedProfitBase: cleanEstimatedProfitBase,
          totalSaving: cleanTotalSaving,
          estimatedProfitTotal: cleanEstimatedProfitTotal,
          ratePerTon: cleanRatePerTon,
          standardTonnage: finalStandardTonnage,
          sanguPercentage: decimalSangu,
          defaultSangu: cleanDefaultSangu,
          additionalTonnageRate: cleanAdditionalTonnageRate,
          hasSpecialDeductions: finalHasSpecialDeductions,
          isActive: values.isActive,
        })

        if (res.success) {
          toast.success("Referensi tarif rute berhasil diperbarui")
          setOpen(false)
          setModalSuccess({
            open: true,
            title: "Perubahan Rute Tersimpan",
            message: `Referensi tarif rute ${values.destination} (${formattedCityPreview}) berhasil diperbarui.`,
            actionMessage: "Selesai",
          })
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
              <span>Tambah Referensi Tarif Pabrik</span>
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
                ? "Tambah Referensi Tarif Pabrik Baru"
                : "Ubah Referensi Tarif Pabrik"}
            </span>
          </div>
        }
        description={
          mode === "create"
            ? "Daftarkan rute pabrik baru beserta acuan tarif dan sangu supir"
            : `Perbarui informasi tarif untuk ${activeRate?.destination || "rute terpilih"}`
        }
        className="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Pabrik Asal */}
          <div className="space-y-1.5">
            <div className="flex h-5 items-center justify-between">
              <Label className="text-xs font-semibold">
                Pabrik Asal <span className="text-destructive">*</span>
              </Label>
              {watchedOriginPlant && (
                <span className="max-w-70 truncate text-[11px] text-muted-foreground">
                  {watchedOriginPlant}
                </span>
              )}
            </div>

            {/* Hidden Input untuk React Hook Form & Zod Schema Validation */}
            <input type="hidden" {...register("originPlant")} />

            {/* Pilihan Pabrik Asal */}
            <div className="grid grid-cols-2 gap-2">
              {availableOriginPlants.map((plant) => {
                const isSelected = watchedOriginPlant === plant.value
                return (
                  <button
                    key={plant.value}
                    type="button"
                    onClick={() => handlePlantChange(plant.value)}
                    className={cn(
                      "flex h-9 cursor-pointer items-center justify-center rounded-lg border px-2.5 py-1 text-xs font-medium transition-all select-none",
                      isSelected
                        ? "border-primary bg-primary/15 font-semibold text-primary shadow-2xs ring-1 ring-primary/40"
                        : "border-border/80 bg-muted/20 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {plant.label}
                  </button>
                )
              })}
            </div>

            {errors.originPlant && (
              <p className="text-[11px] text-destructive">
                {errors.originPlant.message}
              </p>
            )}
          </div>

          {/* Kota Tujuan Bongkar & Tujuan Bongkar (Proyek / BP) - Tampilan Semula (2 Kolom Bersih) */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="city" className="text-xs font-semibold">
                  Kota Tujuan Bongkar{" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="city"
                {...register("city", {
                  onChange: (e) => {
                    const upper = e.target.value.toUpperCase()
                    e.target.value = upper
                    setValue("city", upper, { shouldValidate: true })
                  },
                })}
                placeholder="mis. SEMARANG"
                className="h-9! text-xs font-medium uppercase placeholder:normal-case"
              />
              {errors.city && (
                <p className="text-[11px] text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="destination" className="text-xs font-semibold">
                  Tujuan Bongkar (Proyek / BP){" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="destination"
                {...register("destination", {
                  onChange: (e) => {
                    const upper = e.target.value.toUpperCase()
                    e.target.value = upper
                    setValue("destination", upper, { shouldValidate: true })
                  },
                })}
                placeholder="mis. PT ADHI KARYA"
                className="h-9! text-xs font-medium uppercase placeholder:normal-case"
              />
              {errors.destination && (
                <p className="text-[11px] text-destructive">
                  {errors.destination.message}
                </p>
              )}
            </div>
          </div>

          {/* Parameter Khusus Solusi Bangun Indonesia (SBI) */}
          {isSBI && (
            <div className="animate-in space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 duration-200 fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <RiPinDistanceLine className="size-3.5" />
                  <span>Parameter Khusus SBI</span>
                  <span className="text-[10.5px] font-normal text-muted-foreground">
                    (Solusi Bangun Indonesia)
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-background/60 text-[9.5px] font-medium text-muted-foreground"
                >
                  Opsional
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="cityCode"
                    className="text-xs font-semibold text-foreground"
                  >
                    Kode Tujuan (City Code)
                  </Label>
                  <Input
                    id="cityCode"
                    {...register("cityCode", {
                      onChange: (e) => {
                        const upper = e.target.value.toUpperCase()
                        e.target.value = upper
                        setValue("cityCode", upper, { shouldValidate: true })
                      },
                    })}
                    placeholder="mis. BC35"
                    className="h-9! bg-background font-mono text-xs font-medium uppercase placeholder:normal-case"
                  />
                  {errors.cityCode && (
                    <p className="text-[11px] text-destructive">
                      {errors.cityCode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="distanceKm"
                    className="text-xs font-semibold text-foreground"
                  >
                    Jarak Tempuh
                  </Label>
                  <div className="relative">
                    <Input
                      id="distanceKm"
                      type="text"
                      inputMode="decimal"
                      {...register("distanceKm")}
                      placeholder="mis. 470"
                      className="h-9! bg-background pr-9 font-mono text-xs font-medium"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      Km
                    </span>
                  </div>
                  {errors.distanceKm && (
                    <p className="text-[11px] text-destructive">
                      {errors.distanceKm.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Parameter Khusus Indocement (Grobogan) - Destinasi & Zone Kode */}
          {isIndocement && (
            <div className="animate-in space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 duration-200 fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <RiPinDistanceLine className="size-3.5" />
                  <span>Parameter Khusus Indocement</span>
                  <span className="text-[10.5px] font-normal text-muted-foreground">
                    (Grobogan)
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-background/60 text-[9.5px] font-medium text-muted-foreground"
                >
                  Opsional
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="zoneCode"
                    className="text-xs font-semibold text-foreground"
                  >
                    Zone Kode
                  </Label>
                  <Input
                    id="zoneCode"
                    {...register("zoneCode", {
                      onChange: (e) => {
                        const upper = e.target.value.toUpperCase()
                        e.target.value = upper
                        setValue("zoneCode", upper, { shouldValidate: true })
                      },
                    })}
                    placeholder="mis. 0403"
                    className="h-9! bg-background font-mono text-xs font-medium uppercase placeholder:normal-case"
                  />
                  {errors.zoneCode && (
                    <p className="text-[11px] text-destructive">
                      {errors.zoneCode.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="cityCode"
                    className="text-xs font-semibold text-foreground"
                  >
                    Destinasi Kode
                  </Label>
                  <Input
                    id="cityCode"
                    {...register("cityCode", {
                      onChange: (e) => {
                        const upper = e.target.value.toUpperCase()
                        e.target.value = upper
                        setValue("cityCode", upper, { shouldValidate: true })
                      },
                    })}
                    placeholder="mis. 040304"
                    className="h-9! bg-background font-mono text-xs font-medium uppercase placeholder:normal-case"
                  />
                  {errors.cityCode && (
                    <p className="text-[11px] text-destructive">
                      {errors.cityCode.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Tarif OA per Ton */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="ratePerTon" className="text-xs font-semibold">
                  Tarif OA per Ton <span className="text-destructive">*</span>
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
                    setIsManualSangu(false)
                    setValue("ratePerTon", parseCurrencyInput(e.target.value), {
                      shouldValidate: true,
                    })
                  }}
                  onBlur={() => {
                    if (watchedRatePerTon && watchedRatePerTon.includes(".")) {
                      const [intP, decP] = watchedRatePerTon.split(".")
                      if (decP.length === 1) {
                        setValue("ratePerTon", `${intP}.${decP}0`, {
                          shouldValidate: true,
                        })
                      }
                    }
                  }}
                  placeholder="mis. 100.000,00"
                  className="h-9! pl-9 text-xs font-medium"
                />
              </div>
              {errors.ratePerTon && (
                <p className="text-[11px] text-destructive">
                  {errors.ratePerTon.message}
                </p>
              )}
            </div>

            {/* Persentase Sangu Supir */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="sanguPercentage"
                  className="text-xs font-semibold"
                >
                  Persentase Sangu <span className="text-destructive">*</span>
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="sanguPercentage"
                  type="text"
                  inputMode="decimal"
                  value={watchedSanguPercentage || ""}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^0-9,.]/g, "")
                    setIsManualSangu(false)
                    setValue("sanguPercentage", sanitized, {
                      shouldValidate: true,
                    })
                  }}
                  placeholder="mis. 50,00000"
                  className="h-9! pr-8 text-xs font-medium"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  %
                </span>
              </div>
              {errors.sanguPercentage && (
                <p className="text-[11px] text-destructive">
                  {errors.sanguPercentage.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Tonase Standar */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="standardTonnage"
                  className="text-xs font-semibold"
                >
                  Tonase Standar <span className="text-destructive">*</span>
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="standardTonnage"
                  type="number"
                  step="any"
                  value={watchedStandardTonnage || ""}
                  onChange={(e) => {
                    setIsManualSangu(false)
                    setValue("standardTonnage", e.target.value, {
                      shouldValidate: true,
                    })
                  }}
                  placeholder="mis. 31,00"
                  className="h-9! pr-12 text-xs font-medium"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Ton
                </span>
              </div>
              {errors.standardTonnage && (
                <p className="text-[11px] text-destructive">
                  {errors.standardTonnage.message}
                </p>
              )}
            </div>

            {/* Tarif Kelebihan Tonase */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="additionalTonnageRate"
                  className="text-xs font-semibold"
                >
                  Tarif Lebih Tonase
                </Label>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="additionalTonnageRate"
                  type="text"
                  inputMode="decimal"
                  disabled={watchedUseAdditionalPercentage}
                  value={formatCurrencyInput(
                    watchedAdditionalTonnageRate || ""
                  )}
                  onChange={(e) => {
                    setValue("useAdditionalPercentage", false)
                    setValue(
                      "additionalTonnageRate",
                      parseCurrencyInput(e.target.value)
                    )
                  }}
                  onBlur={() => {
                    if (
                      watchedAdditionalTonnageRate &&
                      watchedAdditionalTonnageRate.includes(".")
                    ) {
                      const [intP, decP] =
                        watchedAdditionalTonnageRate.split(".")
                      if (decP.length === 1) {
                        setValue("additionalTonnageRate", `${intP}.${decP}0`)
                      }
                    }
                  }}
                  placeholder={
                    watchedUseAdditionalPercentage
                      ? "Terhitung otomatis dari persentase"
                      : "mis. 25.000"
                  }
                  className={cn(
                    "h-9! pl-9 text-xs font-medium",
                    watchedUseAdditionalPercentage &&
                      "cursor-not-allowed bg-muted/50 text-muted-foreground opacity-80"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Opsi Hitung Otomatis Tarif Lebih Tonase dari Persentase */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useAdditionalPercentage"
                checked={watchedUseAdditionalPercentage}
                onCheckedChange={(checked) => {
                  const isChecked = checked === true
                  setValue("useAdditionalPercentage", isChecked)
                  if (isChecked && numRate > 0) {
                    const pct =
                      parseFloat(watchedAdditionalPercentage || "30") || 30
                    const roundedTarif = Math.round(numRate)
                    const autoRate = Math.round(roundedTarif * (pct / 100))
                    setValue("additionalTonnageRate", autoRate.toString())
                  }
                }}
              />
              <Label
                htmlFor="useAdditionalPercentage"
                className="cursor-pointer text-xs leading-none font-normal select-none"
              >
                Hitung Tarif Lebih Tonase dari persentase tarif
              </Label>
            </div>

            {watchedUseAdditionalPercentage && (
              <div className="space-y-1.5 rounded-lg border border-border/80 bg-muted/20 p-2.5">
                <div className="flex items-center justify-between gap-3">
                  <Label
                    htmlFor="additionalPercentage"
                    className="text-xs font-medium text-foreground"
                  >
                    Pengali Persentase Lebih Tonase
                  </Label>
                  <div className="relative w-28">
                    <Input
                      id="additionalPercentage"
                      type="number"
                      step="any"
                      value={watchedAdditionalPercentage || ""}
                      onChange={(e) =>
                        setValue("additionalPercentage", e.target.value)
                      }
                      placeholder="mis. 30,00000"
                      className="h-9! pr-7 text-right text-xs font-semibold"
                    />
                    <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      %
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Rumus: {watchedAdditionalPercentage || "30"}% × Tarif
                  Dibulatkan (
                  {numRate > 0 ? formatCurrency(Math.round(numRate)) : "Rp0"}) ={" "}
                  <span className="font-semibold text-primary">
                    {numRate > 0
                      ? formatCurrency(
                          Math.round(
                            Math.round(numRate) *
                              ((parseFloat(
                                watchedAdditionalPercentage || "30"
                              ) || 30) /
                                100)
                          )
                        )
                      : "Rp0"}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Parameter Potongan Khusus & OA Driver (Indocement Grobogan) */}
          {isIndocement && (
            <div className="animate-in space-y-3.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 duration-200 fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <RiPercentLine className="size-3.5" />
                  <span>Potongan Khusus & OA Driver</span>
                  <span className="text-[10.5px] font-normal text-muted-foreground">
                    (Formula Indocement)
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-background/60 text-[9.5px] font-medium text-primary"
                >
                  Otomatis & Bisa Diedit
                </Badge>
              </div>

              {/* Kalkulasi Potongan & Saving */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="saving5Percent"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Saving 5%
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="saving5Percent"
                      type="text"
                      inputMode="decimal"
                      value={formatCurrencyInput(watchedSaving5Percent || "")}
                      onChange={(e) => {
                        const val = parseCurrencyInput(e.target.value)
                        setValue("saving5Percent", val)
                        const nRate = numRate || 0
                        const nSav5 = parseFloat(val) || 0
                        const nDed2 =
                          parseFloat(getValues("deduction2Percent") || "0") || 0
                        const nOa = Math.max(0, nRate - nSav5 - nDed2)
                        setValue("oaDriver", nOa.toString())
                        const nTon = numTon > 0 ? numTon : 31
                        const nRev = Math.round(nOa * nTon)
                        setValue("estimatedRevenue", nRev.toString())
                        const nTotSav = Math.round(nSav5 * nTon)
                        setValue("totalSaving", nTotSav.toString())
                        const nSangu = isManualSangu
                          ? parseFloat(getValues("defaultSangu") || "0") || 0
                          : Math.round(nRev * numPct)
                        if (!isManualSangu && nSangu > 0) {
                          setValue("defaultSangu", nSangu.toString())
                        }
                        const nBaseProfit = nRev - nSangu
                        setValue("estimatedProfitBase", nBaseProfit.toString())
                        setValue(
                          "estimatedProfitTotal",
                          (nBaseProfit + nTotSav).toString()
                        )
                      }}
                      placeholder="mis. 10.725"
                      className="h-8! bg-background pl-8 text-xs font-medium"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    5% × Tarif OA
                  </span>
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="deduction2Percent"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Potongan 2%
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="deduction2Percent"
                      type="text"
                      inputMode="decimal"
                      value={formatCurrencyInput(
                        watchedDeduction2Percent || ""
                      )}
                      onChange={(e) => {
                        const val = parseCurrencyInput(e.target.value)
                        setValue("deduction2Percent", val)
                        const nDed2 = parseFloat(val) || 0
                        const nTon = numTon > 0 ? numTon : 31
                        setValue(
                          "ljuDeduction",
                          Math.round(nTon * nDed2).toString()
                        )
                        const nRate = numRate || 0
                        const nSav5 =
                          parseFloat(getValues("saving5Percent") || "0") || 0
                        const nOa = Math.max(0, nRate - nSav5 - nDed2)
                        setValue("oaDriver", nOa.toString())
                        const nRev = Math.round(nOa * nTon)
                        setValue("estimatedRevenue", nRev.toString())
                        const nTotSav =
                          parseFloat(getValues("totalSaving") || "0") || 0
                        const nSangu = isManualSangu
                          ? parseFloat(getValues("defaultSangu") || "0") || 0
                          : Math.round(nRev * numPct)
                        if (!isManualSangu && nSangu > 0) {
                          setValue("defaultSangu", nSangu.toString())
                        }
                        const nBaseProfit = nRev - nSangu
                        setValue("estimatedProfitBase", nBaseProfit.toString())
                        setValue(
                          "estimatedProfitTotal",
                          (nBaseProfit + nTotSav).toString()
                        )
                      }}
                      placeholder="mis. 4.290"
                      className="h-8! bg-background pl-8 text-xs font-medium"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    2% × Tarif OA
                  </span>
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="ljuDeduction"
                    className="text-[11px] font-medium text-muted-foreground"
                  >
                    Potongan LJU
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="ljuDeduction"
                      type="text"
                      inputMode="decimal"
                      value={formatCurrencyInput(watchedLjuDeduction || "")}
                      onChange={(e) =>
                        setValue(
                          "ljuDeduction",
                          parseCurrencyInput(e.target.value)
                        )
                      }
                      placeholder="mis. 132.990"
                      className="h-8! bg-background pl-8 text-xs font-medium"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Tonase × Potongan 2%
                  </span>
                </div>
              </div>

              {/* Baris 2: OA Driver per Ton */}
              <div className="space-y-1 border-t border-primary/10 pt-2">
                <Label
                  htmlFor="oaDriver"
                  className="text-[11px] font-medium text-muted-foreground"
                >
                  OA Driver per Ton
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    id="oaDriver"
                    type="text"
                    inputMode="decimal"
                    value={formatCurrencyInput(watchedOaDriver || "")}
                    onChange={(e) => {
                      const val = parseCurrencyInput(e.target.value)
                      setValue("oaDriver", val)
                      const nOa = parseFloat(val) || 0
                      const nTon = numTon > 0 ? numTon : 31
                      const nRev = Math.round(nOa * nTon)
                      setValue("estimatedRevenue", nRev.toString())
                      const nTotSav =
                        parseFloat(getValues("totalSaving") || "0") || 0
                      const nSangu = isManualSangu
                        ? parseFloat(getValues("defaultSangu") || "0") || 0
                        : Math.round(nRev * numPct)
                      if (!isManualSangu && nSangu > 0) {
                        setValue("defaultSangu", nSangu.toString())
                      }
                      const nBaseProfit = nRev - nSangu
                      setValue("estimatedProfitBase", nBaseProfit.toString())
                      setValue(
                        "estimatedProfitTotal",
                        (nBaseProfit + nTotSav).toString()
                      )
                    }}
                    placeholder="mis. 199.485"
                    className="h-8! bg-background pl-8 font-mono text-xs font-semibold text-primary"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Tarif OA − Saving 5% − Potongan 2%
                </span>
              </div>
            </div>
          )}

          {/* Sangu Supir */}
          <div className="space-y-1.5">
            <div className="flex h-5 items-center justify-between">
              <Label htmlFor="defaultSangu" className="text-xs font-semibold">
                Sangu Supir
              </Label>
              {(isIndocement
                ? isManualSangu
                : Boolean(watchedDefaultSangu)) && (
                <button
                  type="button"
                  onClick={() => {
                    setIsManualSangu(false)
                    if (isIndocement) {
                      const rev =
                        parseFloat(watchedEstimatedRevenue || "0") || 0
                      const pct = (parseFloat(cleanPctStr) || 0) / 100
                      const autoSangu =
                        rev > 0 && pct > 0 ? Math.round(rev * pct) : 0
                      setValue("defaultSangu", autoSangu.toString())
                      const nTotSav =
                        parseFloat(getValues("totalSaving") || "0") || 0
                      const nBase = rev - autoSangu
                      setValue("estimatedProfitBase", nBase.toString())
                      setValue(
                        "estimatedProfitTotal",
                        (nBase + nTotSav).toString()
                      )
                    } else {
                      setValue("defaultSangu", "")
                    }
                  }}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  {isIndocement
                    ? "Hitung Ulang Otomatis"
                    : "Gunakan Rumus Otomatis"}
                </button>
              )}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                Rp
              </span>
              <Input
                id="defaultSangu"
                type="text"
                inputMode="decimal"
                value={formatCurrencyInput(watchedDefaultSangu || "")}
                onChange={(e) => {
                  const val = parseCurrencyInput(e.target.value)
                  setValue("defaultSangu", val)
                  setIsManualSangu(true)
                  if (isIndocement) {
                    const nSangu = parseFloat(val) || 0
                    const nRev =
                      parseFloat(getValues("estimatedRevenue") || "0") || 0
                    const nTotSav =
                      parseFloat(getValues("totalSaving") || "0") || 0
                    const nBase = nRev - nSangu
                    setValue("estimatedProfitBase", nBase.toString())
                    setValue(
                      "estimatedProfitTotal",
                      (nBase + nTotSav).toString()
                    )
                  }
                }}
                onBlur={() => {
                  if (
                    watchedDefaultSangu &&
                    watchedDefaultSangu.includes(".")
                  ) {
                    const [intP, decP] = watchedDefaultSangu.split(".")
                    if (decP.length === 1) {
                      setValue("defaultSangu", `${intP}.${decP}0`)
                    }
                  }
                }}
                placeholder={
                  isIndocement
                    ? "mis. 3.550.000"
                    : formulaSangu > 0
                      ? `Otomatis: ${formatCurrencyInput(formulaSangu.toString())}`
                      : "mis. 1.300.000"
                }
                className={cn(
                  "h-9! pl-9 text-xs font-medium",
                  isIndocement &&
                    "font-mono font-semibold text-amber-600 dark:text-amber-400"
                )}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isIndocement ? (
                <>
                  Rumus: Estimasi Pendapatan × Persentase Sangu (Bisa diedit
                  manual).
                </>
              ) : (
                <>
                  Rumus: Estimasi Jumlah × % yang diinputkan
                  {watchedSanguPercentage
                    ? ` (${watchedSanguPercentage}%)`
                    : ""}
                  .{" "}
                  {formulaSangu > 0 && !watchedDefaultSangu && (
                    <span className="font-semibold text-foreground">
                      (Terhitung otomatis: {formatCurrency(formulaSangu)})
                    </span>
                  )}
                  {watchedDefaultSangu && (
                    <span className="font-semibold text-primary">
                      (Acuan manual: {formatCurrency(effectiveSangu)})
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Card Kalkulasi Otomatis (Live): Kolom Form Keuntungan & Form Saving (Indocement Grobogan) */}
          {isIndocement && (
            <div className="animate-in space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-3.5 duration-200 fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <RiCalculatorLine className="size-4" />
                  <span>Kalkulasi Otomatis (Live)</span>
                  <span className="text-[10.5px] font-normal text-muted-foreground">
                    (Keuntungan & Saving)
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Basis {watchedStandardTonnage || "31"} Ton
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Kolom Form Keuntungan */}
                <div className="space-y-1.5">
                  <div className="flex h-5 items-center justify-between">
                    <Label
                      htmlFor="estimatedProfitBase"
                      className="text-xs font-semibold text-foreground"
                    >
                      Keuntungan
                    </Label>
                    {(() => {
                      const nRev =
                        parseFloat(watchedEstimatedRevenue || "0") || 0
                      const nSangu = parseFloat(watchedDefaultSangu || "0") || 0
                      const autoBase = nRev > 0 ? nRev - nSangu : 0
                      const curBase =
                        parseFloat(watchedEstimatedProfitBase || "0") || 0
                      const isDiff =
                        autoBase > 0 &&
                        watchedEstimatedProfitBase !== "" &&
                        Math.abs(curBase - autoBase) > 1

                      if (!isDiff) return null

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setValue("estimatedProfitBase", autoBase.toString())
                            const curSav =
                              parseFloat(getValues("totalSaving") || "0") || 0
                            setValue(
                              "estimatedProfitTotal",
                              (autoBase + curSav).toString()
                            )
                          }}
                          className="text-[11px] font-medium text-primary hover:underline"
                        >
                          Hitung Ulang Otomatis
                        </button>
                      )
                    })()}
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="estimatedProfitBase"
                      type="text"
                      inputMode="decimal"
                      value={formatCurrencyInput(
                        watchedEstimatedProfitBase || ""
                      )}
                      onChange={(e) => {
                        const val = parseCurrencyInput(e.target.value)
                        setValue("estimatedProfitBase", val)
                        const nBase = parseFloat(val) || 0
                        const nTotSav =
                          parseFloat(getValues("totalSaving") || "0") || 0
                        setValue(
                          "estimatedProfitTotal",
                          (nBase + nTotSav).toString()
                        )
                      }}
                      placeholder="mis. 2.634.035"
                      className="h-9! bg-background pl-9 font-mono text-xs font-semibold text-foreground"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Rumus: Estimasi Pendapatan − Sangu Supir
                  </p>
                </div>

                {/* Kolom Form Saving */}
                <div className="space-y-1.5">
                  <div className="flex h-5 items-center justify-between">
                    <Label
                      htmlFor="totalSaving"
                      className="text-xs font-semibold text-foreground"
                    >
                      Saving
                    </Label>
                    {(() => {
                      const nSav5 =
                        parseFloat(watchedSaving5Percent || "0") || 0
                      const effTon = numTon > 0 ? numTon : 31
                      const autoSav = Math.round(nSav5 * effTon)
                      const curSav = parseFloat(watchedTotalSaving || "0") || 0
                      const isDiff =
                        autoSav > 0 &&
                        watchedTotalSaving !== "" &&
                        Math.abs(curSav - autoSav) > 1

                      if (!isDiff) return null

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setValue("totalSaving", autoSav.toString())
                            const curBase =
                              parseFloat(
                                getValues("estimatedProfitBase") || "0"
                              ) || 0
                            setValue(
                              "estimatedProfitTotal",
                              (curBase + autoSav).toString()
                            )
                          }}
                          className="text-[11px] font-medium text-primary hover:underline"
                        >
                          Hitung Ulang Otomatis
                        </button>
                      )
                    })()}
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                      Rp
                    </span>
                    <Input
                      id="totalSaving"
                      type="text"
                      inputMode="decimal"
                      value={formatCurrencyInput(watchedTotalSaving || "")}
                      onChange={(e) => {
                        const val = parseCurrencyInput(e.target.value)
                        setValue("totalSaving", val)
                        const nTotSav = parseFloat(val) || 0
                        const nBase =
                          parseFloat(getValues("estimatedProfitBase") || "0") ||
                          0
                        setValue(
                          "estimatedProfitTotal",
                          (nBase + nTotSav).toString()
                        )
                      }}
                      placeholder="mis. 332.475"
                      className="h-9! bg-background pl-9 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Rumus: Saving 5% × Tonase Standar (
                    {watchedStandardTonnage || "31"} Ton)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form Tambahan: Estimasi Jumlah & Estimasi Profit */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Estimasi Jumlah / Pendapatan */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="estimatedJumlah"
                  className="text-xs font-semibold"
                >
                  {isIndocement ? "Estimasi Pendapatan" : "Estimasi Jumlah"}
                </Label>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="estimatedJumlah"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={
                    isIndocement
                      ? formatCurrencyInput(watchedEstimatedRevenue || "0")
                      : estimatedJumlah > 0
                        ? formatCurrencyInput(estimatedJumlah.toString())
                        : "0"
                  }
                  className="h-9! cursor-default bg-muted/40 pl-9 font-mono text-xs font-semibold text-foreground focus-visible:ring-0"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isIndocement ? (
                  <>
                    Rumus: OA Driver × Tonase Standar (
                    {watchedStandardTonnage || "31"} Ton)
                  </>
                ) : (
                  <>
                    Rumus: Tarif × Tonase
                    {watchedStandardTonnage
                      ? ` (${watchedStandardTonnage} Ton)`
                      : ""}
                  </>
                )}
              </p>
            </div>

            {/* Estimasi Profit / Profit Total */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="estimatedProfit"
                  className="text-xs font-semibold"
                >
                  {isIndocement ? "Estimasi Profit Total" : "Estimasi Profit"}
                </Label>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="estimatedProfit"
                  type="text"
                  readOnly
                  tabIndex={-1}
                  value={
                    isIndocement
                      ? formatCurrencyInput(watchedEstimatedProfitTotal || "0")
                      : estimatedProfit !== 0
                        ? formatCurrencyInput(estimatedProfit.toString())
                        : "0"
                  }
                  className={cn(
                    "h-9! cursor-default bg-muted/40 pl-9 font-mono text-xs font-semibold focus-visible:ring-0",
                    (isIndocement
                      ? parseFloat(watchedEstimatedProfitTotal || "0")
                      : estimatedProfit) > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : (isIndocement
                            ? parseFloat(watchedEstimatedProfitTotal || "0")
                            : estimatedProfit) < 0
                        ? "text-destructive"
                        : "text-foreground"
                  )}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isIndocement ? (
                  <>
                    Rumus: Keuntungan (
                    {watchedEstimatedProfitBase
                      ? formatCurrency(parseFloat(watchedEstimatedProfitBase))
                      : "Rp0"}
                    ) + Saving (
                    {watchedTotalSaving
                      ? formatCurrency(parseFloat(watchedTotalSaving))
                      : "Rp0"}
                    )
                  </>
                ) : (
                  <>Rumus: Jumlah − Sangu Supir</>
                )}
              </p>
            </div>
          </div>

          {/* Pratinjau Rangkuman Finansial Rute: Kalkulasi Otomatis (Live) (STANDAR UNTUK SELURUH PABRIK) */}
          <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <RiCalculatorLine className="size-4" />
                <span>Kalkulasi Otomatis (Live)</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Basis {watchedStandardTonnage || "31"} Ton
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-primary/10 pt-1 text-center">
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  {isIndocement ? "Est. Pendapatan" : "Est. Jumlah"}
                </span>
                <span className="font-mono text-sm font-bold">
                  {isIndocement
                    ? parseFloat(watchedEstimatedRevenue || "0") > 0
                      ? formatCurrency(
                          parseFloat(watchedEstimatedRevenue || "0")
                        )
                      : "Rp0"
                    : estimatedJumlah > 0
                      ? formatCurrency(estimatedJumlah)
                      : "Rp0"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  Sangu Supir
                  {watchedSanguPercentage
                    ? ` (${watchedSanguPercentage}%)`
                    : ""}
                </span>
                <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                  {isIndocement
                    ? parseFloat(watchedDefaultSangu || "0") > 0
                      ? formatCurrency(parseFloat(watchedDefaultSangu || "0"))
                      : "Rp0"
                    : effectiveSangu > 0
                      ? formatCurrency(effectiveSangu)
                      : "Rp0"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  {isIndocement ? "Profit Total" : "Est. Profit"}
                </span>
                <span
                  className={cn(
                    "font-mono text-sm font-bold",
                    (isIndocement
                      ? parseFloat(watchedEstimatedProfitTotal || "0")
                      : estimatedProfit) > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : (isIndocement
                            ? parseFloat(watchedEstimatedProfitTotal || "0")
                            : estimatedProfit) < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {isIndocement
                    ? parseFloat(watchedEstimatedProfitTotal || "0") !== 0
                      ? formatCurrency(
                          parseFloat(watchedEstimatedProfitTotal || "0")
                        )
                      : "Rp0"
                    : estimatedProfit !== 0
                      ? formatCurrency(estimatedProfit)
                      : "Rp0"}
                </span>
              </div>
            </div>
          </div>

          {/* Opsi Tambahan */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={watchedIsActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked === true)
                }
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

          <div className="flex items-center justify-end gap-2 border-t px-2 pt-3">
            <Button
              type="button"
              variant="outline"
              className="w-1/2"
              size="lg"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="w-1/2"
              size="lg"
              loading={isPending}
              loadingText="Menyimpan"
            >
              {mode === "create" ? "Simpan Rute" : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </>
  )
}
