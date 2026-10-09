"use client"

import * as React from "react"
import {
  RiCheckLine,
  RiCloseLine,
  RiEditLine,
  RiInformationLine,
  RiMapPinLine,
  RiPercentLine,
  RiPinDistanceLine,
  RiRouteLine,
  RiScales3Line,
  RiTable2,
  RiWallet3Line,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { FactoryIcon } from "@/components/icons"
import { resolveAdditionalTonnageCalculation } from "@/features/rates/rates.calculations"
import { cn, formatCurrency, formatPercentage } from "@/lib/utils"
import type { RateReference } from "@/db/schema"

interface RateDetailSheetProps {
  rate: RateReference | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (rate: RateReference) => void
  onToggleStatus?: (rate: RateReference) => void
}

export function getRateDetailSheetAnimationClasses(): string {
  return "transition-all duration-300 ease-out data-starting-style:translate-x-full data-ending-style:translate-x-full data-starting-style:opacity-0 data-ending-style:opacity-0"
}

export function resolveActiveRateDetail(
  rate: RateReference | null,
  cachedRate: RateReference | null
): RateReference | null {
  return rate ?? cachedRate
}

export { resolveAdditionalTonnageCalculation }

export function RateDetailSheet({
  rate: propRate,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
}: RateDetailSheetProps) {
  const [cachedRate, setCachedRate] = React.useState<RateReference | null>(
    propRate
  )

  React.useEffect(() => {
    if (propRate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCachedRate(propRate)
    }
  }, [propRate])

  const rate = resolveActiveRateDetail(propRate, cachedRate)
  if (!rate) return null

  const numRate = parseFloat(rate.ratePerTon || "0")
  const numTon = parseFloat(rate.standardTonnage || "31")
  const numPct = parseFloat(rate.sanguPercentage || "0")
  const rowJumlah = Math.round(numRate * numTon)
  const formulaSangu = Math.round(rowJumlah * numPct)

  const parsedDefaultSangu = rate.defaultSangu
    ? parseFloat(rate.defaultSangu)
    : 0
  const isLegacyThousandRounding =
    parsedDefaultSangu > 0 &&
    formulaSangu > 0 &&
    Math.abs(parsedDefaultSangu - Math.round(formulaSangu / 1000) * 1000) ===
      0 &&
    Math.abs(parsedDefaultSangu - formulaSangu) < 1000

  const isManualOverride = parsedDefaultSangu > 0 && !isLegacyThousandRounding
  const rowSangu = isManualOverride ? parsedDefaultSangu : formulaSangu
  const rowProfit = rowJumlah - rowSangu

  const isIndocement =
    Boolean(rate.originPlant?.toLowerCase().includes("indocement")) ||
    Boolean(rate.originPlant?.toLowerCase().includes("grobogan")) ||
    Boolean(rate.estimatedProfitTotal)

  const effectiveRevenue =
    isIndocement && rate.estimatedRevenue
      ? parseFloat(rate.estimatedRevenue)
      : rowJumlah

  const effectiveProfit =
    isIndocement && rate.estimatedProfitTotal
      ? parseFloat(rate.estimatedProfitTotal)
      : rowProfit

  const profitMarginPct =
    effectiveRevenue > 0
      ? ((effectiveProfit / effectiveRevenue) * 100).toFixed(2)
      : "0"

  const additionalRate = parseFloat(rate.additionalTonnageRate || "0")
  const additionalCalc = resolveAdditionalTonnageCalculation(
    numRate,
    additionalRate
  )
  const sanguRatioDisplay = (numPct * 100).toFixed(1)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          // Pinned to right, 100% height, flex column
          "flex flex-col gap-0 overflow-hidden bg-background p-0 shadow-2xl",
          // Animasi slide-in dan slide-out penuh dari luar layar
          getRateDetailSheetAnimationClasses(),
          // Mobile & Tablet (< lg): 100% width (Full Screen)
          "w-full max-w-full rounded-none border-0 data-[side=right]:w-full data-[side=right]:max-w-full sm:max-w-full sm:data-[side=right]:max-w-full md:max-w-full md:data-[side=right]:max-w-full",
          // Desktop (lg: 1024px+): Standard Right Drawer (max-w-xl on right edge)
          "lg:w-full lg:max-w-xl lg:border-l lg:border-border lg:data-[side=right]:max-w-xl"
        )}
      >
        {/* Header Pinned */}
        <div className="shrink-0 border-b border-border/80 bg-card/80 px-4 py-3.5 backdrop-blur-md sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
                <RiTable2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Detail Referensi Tarif
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      rate.isActive
                        ? "py-0.2 border-emerald-500/30 bg-emerald-500/10 px-2 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                        : "py-0.2 border-border bg-muted/60 px-2 text-[10px] font-semibold text-muted-foreground"
                    }
                  >
                    <span
                      className={cn(
                        "mr-1 inline-block size-1.5 rounded-full",
                        rate.isActive ? "bg-emerald-500" : "bg-muted-foreground"
                      )}
                    />
                    {rate.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <SheetTitle className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">
                  {rate.city} — {rate.destination}
                </SheetTitle>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="size-8.5 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Tutup Detail Tarif"
            >
              <RiCloseLine className="size-5" />
            </Button>
          </div>
          <SheetDescription className="sr-only">
            Rincian referensi tarif operasional pabrik untuk rute {rate.city} ke{" "}
            {rate.destination}
          </SheetDescription>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6">
          {/* Section 1: Rute & Pabrik Pengiriman */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiRouteLine className="size-3.5 text-primary" />
              <span>Rute & Tujuan Pengiriman</span>
            </h4>
            <div className="space-y-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
              {/* Pabrik Asal Muat with FactoryIcon */}
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
                  <FactoryIcon className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Pabrik Asal Muat
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    {rate.originPlant || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Klien / Rekanan:{" "}
                    <span className="font-semibold text-foreground">
                      {rate.clientName}
                    </span>
                  </p>
                </div>
              </div>

              {/* Visual Route Connector */}
              <div className="ml-4 flex items-center justify-between border-l-2 border-dashed border-border/80 py-0.5 pr-2 pl-7 text-[11px] text-muted-foreground">
                <span>Pengangkutan armada semen curah hi-blow</span>
                {rate.distanceKm && parseFloat(rate.distanceKm) > 0 && (
                  <span className="font-mono text-[11px] font-medium text-foreground">
                    ± {parseFloat(rate.distanceKm)} Km
                  </span>
                )}
              </div>

              {/* Lokasi Tujuan Bongkar with PinIcon */}
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                  <RiMapPinLine className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Kota & Lokasi Tujuan Bongkar
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    {rate.city}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rate.destination}
                  </p>
                  {(rate.cityCode ||
                    rate.zoneCode ||
                    (rate.distanceKm && parseFloat(rate.distanceKm) > 0)) && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {rate.cityCode && (
                        <Badge
                          variant="outline"
                          className="border-primary/20 bg-primary/5 text-[10px] font-medium text-primary"
                        >
                          Destinasi Kode: {rate.cityCode}
                        </Badge>
                      )}
                      {rate.zoneCode && (
                        <Badge
                          variant="outline"
                          className="border-border bg-muted/60 text-[10px] font-medium text-muted-foreground"
                        >
                          Zone Kode: {rate.zoneCode}
                        </Badge>
                      )}
                      {rate.distanceKm && parseFloat(rate.distanceKm) > 0 && (
                        <Badge
                          variant="outline"
                          className="border-border bg-muted/60 text-[10px] font-medium text-muted-foreground"
                        >
                          Jarak: {parseFloat(rate.distanceKm)} Km
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section Tambahan Khusus Indocement Grobogan */}
          {(rate.originPlant?.toLowerCase().includes("indocement") ||
            rate.originPlant?.toLowerCase().includes("grobogan") ||
            rate.saving5Percent ||
            rate.zoneCode) && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-primary uppercase">
                <RiPinDistanceLine className="size-3.5" />
                <span>Parameter Khusus Indocement Grobogan</span>
              </h4>
              <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-xs">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <div className="rounded-xl border border-border/80 bg-background/80 p-2.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Saving 5%
                    </span>
                    <p className="font-mono text-xs font-bold text-foreground">
                      {rate.saving5Percent
                        ? formatCurrency(parseFloat(rate.saving5Percent))
                        : "-"}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      5% × OA/Ton
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-background/80 p-2.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Potongan 2%
                    </span>
                    <p className="font-mono text-xs font-bold text-foreground">
                      {rate.deduction2Percent
                        ? formatCurrency(parseFloat(rate.deduction2Percent))
                        : "-"}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      2% × OA/Ton
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-background/80 p-2.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Potongan LJU
                    </span>
                    <p className="font-mono text-xs font-bold text-foreground">
                      {rate.ljuDeduction
                        ? formatCurrency(parseFloat(rate.ljuDeduction))
                        : "-"}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      Tonase × Pot 2%
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-background/80 p-2.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      OA Driver / Ton
                    </span>
                    <p className="font-mono text-xs font-bold text-primary">
                      {rate.oaDriver
                        ? formatCurrency(parseFloat(rate.oaDriver))
                        : "-"}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      OA − Saving − Pot
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 border-t border-primary/10 pt-2 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/80 bg-background/80 p-2.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Estimasi Pendapatan
                    </span>
                    <p className="font-mono text-xs font-bold text-primary">
                      {rate.estimatedRevenue
                        ? formatCurrency(parseFloat(rate.estimatedRevenue))
                        : "-"}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      OA Driver × Tonase
                    </span>
                  </div>

                  <div className="rounded-xl border border-border/80 bg-background/80 p-2.5">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Keuntungan
                    </span>
                    <p className="font-mono text-xs font-bold text-foreground">
                      {rate.estimatedProfitBase
                        ? formatCurrency(parseFloat(rate.estimatedProfitBase))
                        : "-"}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      Pendapatan − UJ 31 Ton
                    </span>
                  </div>

                  <div className="col-span-2 rounded-xl border border-emerald-500/20 bg-background/80 p-2.5 sm:col-span-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      Total Saving
                    </span>
                    <p className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {rate.totalSaving
                        ? formatCurrency(parseFloat(rate.totalSaving))
                        : "-"}
                    </p>
                    <span className="text-[9px] text-muted-foreground">
                      Saving 5% × Tonase
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Parameter Tarif & Estimasi Pendapatan */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiScales3Line className="size-3.5 text-primary" />
              <span>Parameter Tarif & Estimasi Pendapatan</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Tarif OA / Ton
                </span>
                <p className="mt-1 text-base font-bold text-foreground tabular-nums sm:text-lg">
                  {formatCurrency(numRate)}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  Acuan per ton
                </span>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Standar Tonase
                </span>
                <p className="mt-1 text-base font-bold text-foreground tabular-nums sm:text-lg">
                  {numTon.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    Ton
                  </span>
                </p>
                <span className="text-[10px] text-muted-foreground">
                  Kapasitas standar
                </span>
              </div>

              <div className="col-span-2 rounded-xl border border-primary/30 bg-primary/5 p-3.5 shadow-2xs sm:col-span-1">
                <div className="flex items-center justify-between sm:block">
                  <span className="text-[11px] font-semibold text-primary">
                    Estimasi Bruto
                  </span>
                  <Badge
                    variant="outline"
                    className="border-primary/30 bg-primary/10 text-[10px] text-primary sm:hidden"
                  >
                    Per Rit
                  </Badge>
                </div>
                <p className="mt-1 text-base font-bold text-primary tabular-nums sm:text-lg">
                  {formatCurrency(rowJumlah)}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {numTon.toFixed(0)} Ton × {formatCurrency(numRate)}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-card/60 p-3 shadow-2xs">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      Tarif Lebih Tonase:
                    </span>
                    {additionalCalc.isPercentage ? (
                      <Badge
                        variant="outline"
                        className="border-primary/25 bg-primary/5 text-[10px] font-semibold text-primary"
                      >
                        {additionalCalc.percentage}% dari Tarif OA
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-border bg-muted/60 text-[10px] font-medium text-muted-foreground"
                      >
                        Nominal Acuan Tetap
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {additionalCalc.isPercentage
                      ? `Rumus: ${additionalCalc.percentage}% × Tarif Dibulatkan (${formatCurrency(Math.round(numRate))})`
                      : "Kompensasi per ton jika muatan melebihi tonase standar"}
                  </p>
                </div>
                <div className="flex items-baseline gap-1 self-start sm:self-center">
                  <span className="font-mono text-xs font-bold text-foreground sm:text-sm">
                    {formatCurrency(additionalRate)}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">
                    / Ton
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Sangu Supir & Analisis Profitabilitas */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiWallet3Line className="size-3.5 text-primary" />
              <span>Sangu Supir & Analisis Profitabilitas</span>
            </h4>
            <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Sangu Supir */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>
                      Sangu Supir ({formatPercentage(rate.sanguPercentage)})
                    </span>
                  </div>
                  <p className="text-base font-bold text-amber-600 tabular-nums sm:text-lg dark:text-amber-400">
                    {formatCurrency(rowSangu)}
                  </p>
                  {isManualOverride ? (
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      * Nominal acuan khusus
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">
                      Uang jalan & solar operasional
                    </span>
                  )}
                </div>

                {/* Laba Bersih */}
                <div className="space-y-1 border-l border-border/60 pl-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>Laba Bersih ({profitMarginPct}%)</span>
                  </div>
                  <p className="text-base font-bold text-emerald-600 tabular-nums sm:text-lg dark:text-emerald-400">
                    {formatCurrency(rowProfit)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    Estimasi keuntungan armada
                  </span>
                </div>
              </div>

              {/* Rasio Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Alokasi Pendapatan:</span>
                  <span className="font-mono font-medium">
                    {sanguRatioDisplay}% Sangu : {profitMarginPct}% Laba
                  </span>
                </div>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="bg-amber-500/80 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, numPct * 100))}%`,
                    }}
                    title={`Sangu: ${formatPercentage(rate.sanguPercentage)}`}
                  />
                  <div
                    className="bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, parseFloat(profitMarginPct)))}%`,
                    }}
                    title={`Laba: ${profitMarginPct}%`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Highlight Estimasi Laba Bersih Hero Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-xs dark:bg-emerald-500/15">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Estimasi Laba Bersih per Ritase
                  </span>
                  <Badge
                    variant="outline"
                    className="py-0.2 border-emerald-500/40 bg-emerald-500/20 px-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                  >
                    {profitMarginPct}% Margin
                  </Badge>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {isIndocement && rate.estimatedProfitTotal
                    ? `Kalkulasi Indocement: Keuntungan (${formatCurrency(parseFloat(rate.estimatedProfitBase || "0"))}) + Total Saving (${formatCurrency(parseFloat(rate.totalSaving || "0"))})`
                    : `Kalkulasi: Bruto (${formatCurrency(rowJumlah)}) − Sangu (${formatCurrency(rowSangu)})`}
                </p>
              </div>
              <span className="font-mono text-xl font-bold tracking-tight text-emerald-600 sm:text-2xl dark:text-emerald-400">
                {formatCurrency(effectiveProfit)}
              </span>
            </div>
          </div>

          {/* Section 5: Ketentuan Khusus Pabrik */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiInformationLine className="size-3.5 text-primary" />
              <span>Ketentuan Khusus Pabrik</span>
            </h4>
            <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="text-xs font-semibold text-foreground">
                    Potongan Khusus Pabrik / LJU
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {rate.hasSpecialDeductions
                      ? "Rute ini menerapkan pajak 1%, potongan LJU 2%, atau potongan UJ Grobogan 5%."
                      : "Rute ini menggunakan ketentuan tarif standar tanpa potongan khusus."}
                  </p>
                </div>
                {rate.hasSpecialDeductions ? (
                  <Badge
                    variant="secondary"
                    className="w-fit gap-1 bg-purple-500/10 text-xs font-semibold text-purple-700 dark:text-purple-300"
                  >
                    <RiPercentLine className="size-3" />
                    <span>Berlaku (LJU)</span>
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="w-fit text-xs text-muted-foreground"
                  >
                    Tidak Berlaku
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Footer Actions */}
        <div className="shrink-0 border-t border-border/80 bg-card/90 p-4 backdrop-blur-md sm:px-6 sm:py-4">
          {/* Mobile Layout (< sm) */}
          <div className="flex flex-col gap-2 sm:hidden">
            <div className="grid grid-cols-2 gap-2">
              {onToggleStatus && (
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => onToggleStatus(rate)}
                  className={cn(
                    "h-10 gap-1.5 text-xs font-semibold shadow-xs",
                    rate.isActive
                      ? "border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                      : "border-emerald-500/30 text-emerald-600 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {rate.isActive ? (
                    <>
                      <RiCloseLine className="size-4" />
                      <span>Nonaktifkan</span>
                    </>
                  ) : (
                    <>
                      <RiCheckLine className="size-4" />
                      <span>Aktifkan</span>
                    </>
                  )}
                </Button>
              )}
              {onEdit && (
                <Button
                  type="button"
                  size="default"
                  onClick={() => {
                    onOpenChange(false)
                    onEdit(rate)
                  }}
                  className={cn(
                    "h-10 gap-1.5 text-xs font-semibold shadow-xs transition-all hover:shadow-sm",
                    !onToggleStatus && "col-span-2"
                  )}
                >
                  <RiEditLine className="size-4" />
                  <span>Ubah Tarif</span>
                </Button>
              )}
            </div>
            {/* Tombol Tutup di posisi paling bawah pada mobile */}
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => onOpenChange(false)}
              className="h-10 w-full text-xs font-semibold shadow-xs"
            >
              Tutup
            </Button>
          </div>

          {/* Tablet & Desktop Layout (>= sm) */}
          <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
            <div>
              {onToggleStatus && (
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => onToggleStatus(rate)}
                  className={cn(
                    "h-10 gap-1.5 text-xs font-semibold shadow-xs",
                    rate.isActive
                      ? "border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
                      : "border-emerald-500/30 text-emerald-600 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {rate.isActive ? (
                    <>
                      <RiCloseLine className="size-4" />
                      <span>Nonaktifkan Rute</span>
                    </>
                  ) : (
                    <>
                      <RiCheckLine className="size-4" />
                      <span>Aktifkan Rute</span>
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={() => onOpenChange(false)}
                className="h-10 px-4 text-xs font-semibold shadow-xs"
              >
                Tutup
              </Button>
              {onEdit && (
                <Button
                  type="button"
                  size="default"
                  onClick={() => {
                    onOpenChange(false)
                    onEdit(rate)
                  }}
                  className="h-10 gap-2 px-5 text-xs font-semibold shadow-xs transition-all hover:shadow-sm"
                >
                  <RiEditLine className="size-4" />
                  <span>Ubah Tarif</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
