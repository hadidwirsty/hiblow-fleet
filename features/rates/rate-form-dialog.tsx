/* eslint-disable react-hooks/set-state-in-effect */
"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { RiAddLine, RiCalculatorLine, RiRouteLine } from "@remixicon/react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

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
  rateFormSchema,
  type RateFormValues,
} from "@/features/rates/rates.schema"
import {
  cn,
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
} from "@/lib/utils"
import { useUIStore } from "@/stores/theme"
import type { RateReference } from "@/db/schema"

interface RateFormDialogProps {
  mode?: "create" | "edit"
  rate?: RateReference
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
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

  const { setModalSuccess } = useUIStore()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RateFormValues>({
    resolver: zodResolver(rateFormSchema),
    defaultValues: {
      originPlant: "",
      clientName: "",
      city: "",
      destination: "",
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
  const watchedOriginPlant = watch("originPlant")
  const watchedClientName = watch("clientName")
  const watchedCity = watch("city")
  const watchedDestination = watch("destination")
  const watchedRatePerTon = watch("ratePerTon")
  const watchedStandardTonnage = watch("standardTonnage")
  const watchedSanguPercentage = watch("sanguPercentage")
  const watchedDefaultSangu = watch("defaultSangu")
  const watchedAdditionalTonnageRate = watch("additionalTonnageRate")
  const watchedUseAdditionalPercentage = watch("useAdditionalPercentage")
  const watchedAdditionalPercentage = watch("additionalPercentage")
  const watchedHasSpecialDeductions = watch("hasSpecialDeductions")
  const watchedIsActive = watch("isActive")

  // Reset or pre-populate form on dialog open/close
  useEffect(() => {
    if (open) {
      if (mode === "edit" && rate) {
        const pctFromDb = rate.sanguPercentage
          ? parseFloat(rate.sanguPercentage) * 100
          : 52
        const roundedPct = Number(pctFromDb.toFixed(5))

        const numR = parseFloat(rate.ratePerTon) || 0
        const numT = parseFloat(rate.standardTonnage || "31") || 0
        const numP = parseFloat(rate.sanguPercentage) || 0
        const estJ = Math.round(numR * numT)
        const formS = Math.round(estJ * numP)
        const defS = rate.defaultSangu ? parseFloat(rate.defaultSangu) : 0
        const isLegacy =
          defS > 0 &&
          formS > 0 &&
          Math.abs(defS - Math.round(formS / 1000) * 1000) === 0 &&
          Math.abs(defS - formS) < 1000

        const currentAddRate = parseFloat(rate.additionalTonnageRate ?? "0")
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

        reset({
          originPlant: rate.originPlant ?? "",
          clientName: rate.clientName ?? "",
          city: rate.city ?? "",
          destination: rate.destination ?? "",
          ratePerTon: rate.ratePerTon ?? "",
          standardTonnage: rate.standardTonnage ?? "",
          sanguPercentage: roundedPct.toString().replace(".", ","),
          defaultSangu: isLegacy ? "" : (rate.defaultSangu ?? ""),
          additionalTonnageRate: rate.additionalTonnageRate ?? "",
          useAdditionalPercentage: isAddPct,
          additionalPercentage: addPctVal,
          hasSpecialDeductions: rate.hasSpecialDeductions ?? false,
          isActive: rate.isActive ?? true,
        })
      } else if (mode === "create") {
        reset({
          originPlant: "",
          clientName: "",
          city: "",
          destination: "",
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
  }, [open, mode, rate, reset])

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

    try {
      if (mode === "create") {
        const res = await createRateReference({
          originPlant: values.originPlant.trim(),
          clientName: derivedClientName,
          city: values.city.toUpperCase().trim(),
          destination: values.destination.toUpperCase().trim(),
          ratePerTon: cleanRatePerTon,
          standardTonnage: finalStandardTonnage,
          sanguPercentage: decimalSangu,
          defaultSangu: cleanDefaultSangu,
          additionalTonnageRate: cleanAdditionalTonnageRate,
          hasSpecialDeductions: values.hasSpecialDeductions,
          isActive: values.isActive,
        })

        if (res.success) {
          toast.success("Referensi tarif rute baru berhasil disimpan")
          setOpen(false)
          reset()
          setModalSuccess({
            open: true,
            title: "Rute Berhasil Ditambahkan",
            message: `Referensi tarif rute ${values.destination} (${values.city}) berhasil disimpan ke sistem.`,
            actionMessage: "Selesai",
          })
        } else {
          setError(res.error)
        }
      } else if (mode === "edit" && rate) {
        const res = await updateRateReference({
          id: rate.id,
          originPlant: values.originPlant.trim(),
          clientName: derivedClientName,
          city: values.city.toUpperCase().trim(),
          destination: values.destination.toUpperCase().trim(),
          ratePerTon: cleanRatePerTon,
          standardTonnage: finalStandardTonnage,
          sanguPercentage: decimalSangu,
          defaultSangu: cleanDefaultSangu,
          additionalTonnageRate: cleanAdditionalTonnageRate,
          hasSpecialDeductions: values.hasSpecialDeductions,
          isActive: values.isActive,
        })

        if (res.success) {
          toast.success("Referensi tarif rute berhasil diperbarui")
          setOpen(false)
          setModalSuccess({
            open: true,
            title: "Perubahan Rute Tersimpan",
            message: `Referensi tarif rute ${values.destination} (${values.city}) berhasil diperbarui.`,
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
                : "Edit Referensi Tarif Pabrik"}
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Pabrik Asal */}
          <div className="space-y-1.5">
            <div className="flex h-5 items-center justify-between">
              <Label htmlFor="originPlant" className="text-xs font-semibold">
                Pabrik Asal (Nama Pabrik - Kota Asal){" "}
                <span className="text-destructive">*</span>
              </Label>
            </div>
            <Input
              id="originPlant"
              {...register("originPlant", {
                onChange: (e) => {
                  const val = e.target.value
                  if (
                    val.includes("SBI") ||
                    val.toLowerCase().includes("solusi bangun")
                  ) {
                    setValue(
                      "clientName",
                      "Solusi Bangun Indonesia (SBI) - Tuban"
                    )
                  } else if (
                    val.includes("Grobogan") ||
                    val.toLowerCase().includes("indocement")
                  ) {
                    setValue("clientName", "Indocement")
                  } else if (val.includes("Rembang")) {
                    setValue("clientName", "Semen Indonesia - Rembang")
                  } else if (val.includes("Tuban")) {
                    setValue("clientName", "Semen Indonesia - Tuban")
                  }
                },
              })}
              placeholder="mis. Semen Indonesia (SI) - Tuban"
              list="origin-plant-suggestions"
              className="h-9! text-xs font-medium"
            />
            <datalist id="origin-plant-suggestions">
              {distinctOriginPlants.map((plant) => (
                <option key={plant} value={plant} />
              ))}
            </datalist>
            {errors.originPlant && (
              <p className="text-[11px] text-destructive">
                {errors.originPlant.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Kota Tujuan Bongkar */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="city" className="text-xs font-semibold">
                  Kota Tujuan Bongkar{" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="city"
                {...register("city")}
                placeholder="mis. Semarang"
                className="h-9! text-xs font-medium"
              />
              {errors.city && (
                <p className="text-[11px] text-destructive">
                  {errors.city.message}
                </p>
              )}
            </div>

            {/* Nama Proyek / Titik Bongkar */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label htmlFor="destination" className="text-xs font-semibold">
                  Tujuan Bongkar (Proyek / BP){" "}
                  <span className="text-destructive">*</span>
                </Label>
              </div>
              <Input
                id="destination"
                {...register("destination")}
                placeholder="mis. PT Ananda Pratama"
                className="h-9! text-xs font-medium"
              />
              {errors.destination && (
                <p className="text-[11px] text-destructive">
                  {errors.destination.message}
                </p>
              )}
            </div>
          </div>

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
                  placeholder="mis. 62.795,50"
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
                    setValue("sanguPercentage", sanitized, {
                      shouldValidate: true,
                    })
                  }}
                  placeholder="mis. 52 atau 52,58552"
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
                  onChange={(e) =>
                    setValue("standardTonnage", e.target.value, {
                      shouldValidate: true,
                    })
                  }
                  placeholder="mis. 31.00"
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
                  placeholder="mis. 25.000"
                  className="h-9! pl-9 text-xs font-medium"
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
                      placeholder="30"
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

          {/* Sangu Supir */}
          <div className="space-y-1.5">
            <div className="flex h-5 items-center justify-between">
              <Label htmlFor="defaultSangu" className="text-xs font-semibold">
                Sangu Supir
              </Label>
              {watchedDefaultSangu && (
                <button
                  type="button"
                  onClick={() => setValue("defaultSangu", "")}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Gunakan Rumus Otomatis
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
                onChange={(e) =>
                  setValue("defaultSangu", parseCurrencyInput(e.target.value))
                }
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
                  formulaSangu > 0
                    ? `Otomatis: ${formatCurrencyInput(formulaSangu.toString())}`
                    : "mis. 1.306.974"
                }
                className="h-9! pl-9 text-xs font-medium"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Rumus: Estimasi Jumlah × % yang diinputkan
              {watchedSanguPercentage
                ? ` (${watchedSanguPercentage}%)`
                : ""}.{" "}
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
            </p>
          </div>

          {/* Form Tambahan: Estimasi Jumlah & Estimasi Profit */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Estimasi Jumlah (Tarif x Tonase) */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="estimatedJumlah"
                  className="text-xs font-semibold"
                >
                  Estimasi Jumlah
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
                    estimatedJumlah > 0
                      ? formatCurrencyInput(estimatedJumlah.toString())
                      : "0"
                  }
                  className="h-9! cursor-default bg-muted/40 pl-9 font-mono text-xs font-semibold text-foreground focus-visible:ring-0"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Rumus: Tarif × Tonase
                {watchedStandardTonnage
                  ? ` (${watchedStandardTonnage} Ton)`
                  : ""}
              </p>
            </div>

            {/* Estimasi Profit (Jumlah - Sangu Supir) */}
            <div className="space-y-1.5">
              <div className="flex h-5 items-center justify-between">
                <Label
                  htmlFor="estimatedProfit"
                  className="text-xs font-semibold"
                >
                  Estimasi Profit
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
                    estimatedProfit !== 0
                      ? formatCurrencyInput(estimatedProfit.toString())
                      : "0"
                  }
                  className={cn(
                    "h-9! cursor-default bg-muted/40 pl-9 font-mono text-xs font-semibold focus-visible:ring-0",
                    estimatedProfit > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : estimatedProfit < 0
                        ? "text-destructive"
                        : "text-foreground"
                  )}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Rumus: Jumlah − Sangu Supir
              </p>
            </div>
          </div>

          {/* Pratinjau Rangkuman Finansial Rute */}
          <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <RiCalculatorLine className="size-4" />
                <span>Kalkulasi Otomatis (Live)</span>
              </div>
              {watchedStandardTonnage && (
                <span className="text-[10px] text-muted-foreground">
                  Basis {watchedStandardTonnage} Ton
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-primary/10 pt-1 text-center">
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  Est. Jumlah
                </span>
                <span className="font-mono text-sm font-bold">
                  {estimatedJumlah > 0
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
                  {effectiveSangu > 0 ? formatCurrency(effectiveSangu) : "Rp0"}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-muted-foreground">
                  Est. Profit
                </span>
                <span
                  className={cn(
                    "font-mono text-sm font-bold",
                    estimatedProfit > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : estimatedProfit < 0
                        ? "text-destructive"
                        : "text-muted-foreground"
                  )}
                >
                  {estimatedProfit !== 0
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
                id="hasSpecialDeductions"
                checked={watchedHasSpecialDeductions}
                onCheckedChange={(checked) =>
                  setValue("hasSpecialDeductions", checked === true)
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
