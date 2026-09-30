"use client"

import * as React from "react"
import {
  RiCheckLine,
  RiCloseLine,
  RiEditLine,
  RiFlightTakeoffLine,
  RiInformationLine,
  RiMapPinLine,
  RiPercentLine,
  RiRouteLine,
  RiScales3Line,
  RiWallet3Line,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatCurrency, formatPercentage } from "@/lib/utils"
import type { RateReference } from "@/db/schema"

interface RateDetailSheetProps {
  rate: RateReference | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (rate: RateReference) => void
  onToggleStatus?: (rate: RateReference) => void
}

export function RateDetailSheet({
  rate,
  open,
  onOpenChange,
  onEdit,
  onToggleStatus,
}: RateDetailSheetProps) {
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
  const profitMarginPct =
    rowJumlah > 0 ? ((rowProfit / rowJumlah) * 100).toFixed(2) : "0"

  const additionalRate = parseFloat(rate.additionalTonnageRate || "0")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-full overflow-y-auto p-0 data-[side=right]:w-full sm:max-w-lg sm:data-[side=right]:max-w-lg md:max-w-xl md:data-[side=right]:max-w-xl"
      >
        {/* Header Drawer dengan padding kanan aman dari tombol close */}
        <SheetHeader className="border-b bg-muted/40 p-4 pr-12 sm:p-6 sm:pr-14">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <RiRouteLine className="size-4" />
              </span>
              <SheetTitle className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                {rate.city} — {rate.destination}
              </SheetTitle>
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
            </div>
            <SheetDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-[10px] font-semibold text-primary"
              >
                {rate.originPlant || rate.clientName}
              </Badge>
              <span>Referensi Tarif Operasional Armada</span>
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Content Body */}
        <div className="space-y-5 p-4 sm:p-6">
          {/* Section 1: Informasi Lokasi & Klien */}
          <div className="space-y-2.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiMapPinLine className="size-3.5 text-primary" />
              <span>Rute & Tujuan Pengiriman</span>
            </h4>
            <div className="space-y-3 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <RiFlightTakeoffLine className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-muted-foreground">
                    Pabrik Asal Muat
                  </span>
                  <p className="text-xs font-semibold text-foreground sm:text-sm">
                    {rate.originPlant}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-border/50 pt-2.5">
                <RiMapPinLine className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-muted-foreground">
                    Kota & Lokasi Tujuan Bongkar
                  </span>
                  <p className="text-xs font-semibold text-foreground sm:text-sm">
                    {rate.city}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rate.destination}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-xs">
                <span className="text-muted-foreground">Klien / Rekanan:</span>
                <span className="font-medium text-foreground">
                  {rate.clientName}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Parameter Tarif & Standar Tonase */}
          <div className="space-y-2.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiScales3Line className="size-3.5 text-primary" />
              <span>Parameter Tarif & Estimasi Pendapatan</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
                <span className="block text-[11px] text-muted-foreground">
                  Tarif OA / Ton
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {formatCurrency(numRate)}
                </span>
              </div>

              <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
                <span className="block text-[11px] text-muted-foreground">
                  Standar Tonase
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {numTon.toFixed(2)} Ton
                </span>
              </div>

              <div className="col-span-2 rounded-lg border border-border/70 bg-card p-3 shadow-2xs sm:col-span-1">
                <span className="block text-[11px] text-muted-foreground">
                  Estimasi Jumlah
                </span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {formatCurrency(rowJumlah)}
                </span>
              </div>

              <div className="col-span-2 rounded-lg border border-border/70 bg-card p-3 shadow-2xs sm:col-span-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="block text-[11px] text-muted-foreground">
                      Tarif Lebih Tonase
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Tambahan per ton jika muatan melebihi standar
                    </span>
                  </div>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {formatCurrency(additionalRate)} / Ton
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Rincian Sangu Supir & Profitabilitas */}
          <div className="space-y-2.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiWallet3Line className="size-3.5 text-primary" />
              <span>Sangu Supir & Analisis Profitabilitas</span>
            </h4>
            <div className="space-y-2.5 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Persentase Sangu:</span>
                <Badge
                  variant="outline"
                  className="font-mono text-xs font-semibold text-primary"
                >
                  {formatPercentage(rate.sanguPercentage)}
                </Badge>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                <div>
                  <span className="block text-muted-foreground">
                    Sangu Supir / Uang Jalan Acuan:
                  </span>
                  {isManualOverride && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400">
                      * Nominal ditetapkan manual khusus
                    </span>
                  )}
                </div>
                <span className="font-mono text-sm font-bold text-primary">
                  {formatCurrency(rowSangu)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                <span className="text-muted-foreground">
                  Estimasi Margin Laba:
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {profitMarginPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Highlight Estimasi Laba Bersih */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-2xs dark:bg-emerald-500/15">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="block text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Estimasi Laba Bersih per Ritase
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Perhitungan: Estimasi Jumlah ({formatCurrency(rowJumlah)}) −
                  Sangu Supir ({formatCurrency(rowSangu)})
                </span>
              </div>
              <span className="shrink-0 font-mono text-lg font-bold text-emerald-700 sm:text-xl dark:text-emerald-400">
                {formatCurrency(rowProfit)}
              </span>
            </div>
          </div>

          {/* Section 5: Ketentuan Khusus / Pajak */}
          <div className="space-y-2.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiInformationLine className="size-3.5 text-primary" />
              <span>Ketentuan Khusus Pabrik</span>
            </h4>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs shadow-2xs">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-semibold text-foreground">
                    Potongan Khusus Pabrik / LJU
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Perlakuan pajak 1%, potongan LJU 2%, atau potongan UJ
                    Grobogan 5%
                  </p>
                </div>
                {rate.hasSpecialDeductions ? (
                  <Badge
                    variant="secondary"
                    className="w-fit bg-purple-500/10 text-[11px] font-semibold text-purple-700 dark:text-purple-300"
                  >
                    <RiPercentLine className="mr-0.5 size-3" />
                    Berlaku (LJU)
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="w-fit text-[11px] text-muted-foreground"
                  >
                    Tidak Berlaku
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Drawer Responsif */}
        <SheetFooter className="border-t bg-muted/20 p-4">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
              {onToggleStatus && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(rate)}
                  className="w-full justify-center gap-1 px-2 text-xs sm:w-auto sm:gap-1.5 sm:px-3"
                >
                  {rate.isActive ? (
                    <>
                      <RiCloseLine className="size-3.5 text-destructive" />
                      <span className="truncate">Nonaktifkan</span>
                    </>
                  ) : (
                    <>
                      <RiCheckLine className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="truncate">Aktifkan</span>
                    </>
                  )}
                </Button>
              )}
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false)
                    onEdit(rate)
                  }}
                  className="w-full justify-center gap-1.5 text-xs sm:w-auto"
                >
                  <RiEditLine className="size-3.5" />
                  <span>Edit Tarif</span>
                </Button>
              )}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full justify-center text-xs sm:w-auto"
            >
              Tutup
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
