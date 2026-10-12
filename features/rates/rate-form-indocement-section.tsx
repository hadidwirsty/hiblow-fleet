"use client"

import * as React from "react"
import { RiCalculatorLine, RiPercentLine } from "@remixicon/react"
import type { UseFormGetValues, UseFormSetValue } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils"
import type { RateFormValues } from "@/features/rates/rates.schema"

interface RateFormIndocementDeductionsProps {
  watchedSaving5Percent?: string | null
  watchedDeduction2Percent?: string | null
  watchedLjuDeduction?: string | null
  watchedOaDriver?: string | null
  numRate: number
  numTon: number
  numPct: number
  isManualSangu: boolean
  setValue: UseFormSetValue<RateFormValues>
  getValues: UseFormGetValues<RateFormValues>
}

/**
 * Komponen input & kalkulasi potongan khusus serta OA Driver untuk rute Indocement - Grobogan.
 */
export function RateFormIndocementDeductions({
  watchedSaving5Percent,
  watchedDeduction2Percent,
  watchedLjuDeduction,
  watchedOaDriver,
  numRate,
  numTon,
  numPct,
  isManualSangu,
  setValue,
  getValues,
}: RateFormIndocementDeductionsProps) {
  return (
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
              value={formatCurrencyInput(watchedDeduction2Percent || "")}
              onChange={(e) => {
                const val = parseCurrencyInput(e.target.value)
                setValue("deduction2Percent", val)
                const nDed2 = parseFloat(val) || 0
                const nTon = numTon > 0 ? numTon : 31
                setValue("ljuDeduction", Math.round(nTon * nDed2).toString())
                const nRate = numRate || 0
                const nSav5 =
                  parseFloat(getValues("saving5Percent") || "0") || 0
                const nOa = Math.max(0, nRate - nSav5 - nDed2)
                setValue("oaDriver", nOa.toString())
                const nRev = Math.round(nOa * nTon)
                setValue("estimatedRevenue", nRev.toString())
                const nTotSav = parseFloat(getValues("totalSaving") || "0") || 0
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
                setValue("ljuDeduction", parseCurrencyInput(e.target.value))
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

      {/* OA Driver */}
      <div className="space-y-1 border-t border-primary/10 pt-2.5">
        <Label
          htmlFor="oaDriver"
          className="text-[11px] font-medium text-muted-foreground"
        >
          OA Driver / Ton
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
              const nSangu = isManualSangu
                ? parseFloat(getValues("defaultSangu") || "0") || 0
                : Math.round(nRev * numPct)
              if (!isManualSangu && nSangu > 0) {
                setValue("defaultSangu", nSangu.toString())
              }
              const nTotSav = parseFloat(getValues("totalSaving") || "0") || 0
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
  )
}

interface RateFormIndocementLiveCardProps {
  watchedEstimatedProfitBase?: string | null
  watchedTotalSaving?: string | null
  watchedEstimatedRevenue?: string | null
  watchedDefaultSangu?: string | null
  watchedSaving5Percent?: string | null
  watchedStandardTonnage?: string | null
  numTon: number
  setValue: UseFormSetValue<RateFormValues>
  getValues: UseFormGetValues<RateFormValues>
}

/**
 * Komponen Card Kalkulasi Otomatis (Live) untuk Keuntungan & Saving rute Indocement - Grobogan.
 */
export function RateFormIndocementLiveCard({
  watchedEstimatedProfitBase,
  watchedTotalSaving,
  watchedEstimatedRevenue,
  watchedDefaultSangu,
  watchedSaving5Percent,
  watchedStandardTonnage,
  numTon,
  setValue,
  getValues,
}: RateFormIndocementLiveCardProps) {
  return (
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
              const nRev = parseFloat(watchedEstimatedRevenue || "0") || 0
              const nSangu = parseFloat(watchedDefaultSangu || "0") || 0
              const autoBase = nRev > 0 ? nRev - nSangu : 0
              const curBase = parseFloat(watchedEstimatedProfitBase || "0") || 0
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
              value={formatCurrencyInput(watchedEstimatedProfitBase || "")}
              onChange={(e) => {
                const val = parseCurrencyInput(e.target.value)
                setValue("estimatedProfitBase", val)
                const nBase = parseFloat(val) || 0
                const nTotSav = parseFloat(getValues("totalSaving") || "0") || 0
                setValue("estimatedProfitTotal", (nBase + nTotSav).toString())
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
              const nSav5 = parseFloat(watchedSaving5Percent || "0") || 0
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
                      parseFloat(getValues("estimatedProfitBase") || "0") || 0
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
                  parseFloat(getValues("estimatedProfitBase") || "0") || 0
                setValue("estimatedProfitTotal", (nBase + nTotSav).toString())
              }}
              placeholder="mis. 332.475"
              className="h-9! bg-background pl-9 font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Rumus: Saving 5% × Tonase Standar ({watchedStandardTonnage || "31"}{" "}
            Ton)
          </p>
        </div>
      </div>
    </div>
  )
}
