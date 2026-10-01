"use client"

import * as React from "react"
import {
  RiCalendarLine,
  RiCloseLine,
  RiEditLine,
  RiFileTextLine,
  RiMapPinLine,
  RiPercentLine,
  RiRouteLine,
  RiScales3Line,
  RiTruckLine,
  RiWallet3Line,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { getDriverAndTruck } from "@/domain/trucks"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { FactoryIcon } from "@/components/icons"
import { isDoFeePaid } from "@/features/trips/trips.filter"
import { cn, formatCurrency, formatDateIndonesian } from "@/lib/utils"

import type { TripRecord } from "@/features/trips/trips-table"

interface TripDetailSheetProps {
  trip: TripRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
  originPlant?: string
  onEdit?: (trip: TripRecord) => void
}

export function TripDetailSheet({
  trip,
  open,
  onOpenChange,
  originPlant = "-",
  onEdit,
}: TripDetailSheetProps) {
  if (!trip) return null

  const driverInfo = getDriverAndTruck(trip.truckId)
  const isPaid = isDoFeePaid(trip.thirdPartyStatus)
  const feeAmount = parseFloat(trip.thirdPartyFee || "0")
  const hasFee = feeAmount > 0 || Boolean(trip.thirdPartyName)

  const loadedTon = trip.loadedTonnage ? parseFloat(trip.loadedTonnage) : 31.0
  const unloadedTon =
    trip.unloadingDate && parseFloat(trip.unloadedTonnage || "0") > 0
      ? parseFloat(trip.unloadedTonnage)
      : null
  const shrinkageTon =
    unloadedTon !== null ? Math.max(0, loadedTon - unloadedTon) : null

  const ratePerTon = parseFloat(trip.ratePerTon || "0")
  const omset = parseFloat(trip.omset || "0")
  const sangu = parseFloat(trip.sangu || "0")
  const profit = parseFloat(trip.profit || "0")
  const profitMarginPct = omset > 0 ? ((profit / omset) * 100).toFixed(2) : "0"

  // Deductions
  const tax1 = parseFloat(trip.tax1Pct || "0")
  const ded2Lju = parseFloat(trip.deduction2PctLju || "0")
  const ded5Uj = parseFloat(trip.deduction5PctUjGrb || "0")
  const meal = parseFloat(trip.mealAllowance || "0")
  const savings = parseFloat(trip.savings || "0")
  const claim = parseFloat(trip.claim || "0")
  const claimDriver = parseFloat(trip.claimDriver || "0")
  const totalDeductions =
    tax1 + ded2Lju + ded5Uj + meal + savings + claim + claimDriver

  // Incentives
  const incentivePaid = parseFloat(trip.incentivePaid || "0")

  const formattedOrderNumber = trip.orderNumber.startsWith("#")
    ? trip.orderNumber
    : `#${trip.orderNumber}`

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={cn(
          // Pinned to right, 100% height, flex column
          "flex flex-col gap-0 overflow-hidden bg-background p-0 shadow-2xl",
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
                <RiTruckLine className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Detail Surat Jalan
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      trip.truckId === "W8187UA"
                        ? "py-0.2 border-primary/40 bg-primary/10 px-2 text-[10px] font-semibold text-primary"
                        : "py-0.2 border-amber-500/40 bg-amber-500/10 px-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                    }
                  >
                    <span
                      className={cn(
                        "mr-1 inline-block size-1.5 rounded-full",
                        trip.truckId === "W8187UA"
                          ? "bg-primary"
                          : "bg-amber-500"
                      )}
                    />
                    {driverInfo.driver} — {driverInfo.plate}
                  </Badge>
                </div>
                <SheetTitle className="truncate font-mono text-base font-bold tracking-tight text-foreground sm:text-lg">
                  {formattedOrderNumber} — {trip.destinationCity}
                </SheetTitle>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="size-8.5 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Tutup Detail Surat Jalan"
            >
              <RiCloseLine className="size-5" />
            </Button>
          </div>
          <SheetDescription className="sr-only">
            Rincian informasi pengiriman surat jalan {formattedOrderNumber} rute{" "}
            {trip.destinationCity}
          </SheetDescription>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6">
          {/* Section 1: Rute & Waktu Pengiriman */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiRouteLine className="size-3.5 text-primary" />
              <span>Rute & Waktu Pengiriman</span>
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
                    {originPlant || "-"}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <RiCalendarLine className="size-3 text-muted-foreground" />
                    <span>
                      Tanggal Muat:{" "}
                      <strong className="font-semibold text-foreground">
                        {formatDateIndonesian(trip.orderDate, true)}
                      </strong>
                    </span>
                  </p>
                </div>
              </div>

              {/* Visual Route Connector */}
              <div className="ml-4 flex items-center gap-2 border-l-2 border-dashed border-border/80 py-0.5 pl-7 text-[11px] text-muted-foreground">
                <span>Pengangkutan armada semen curah hi-blow</span>
              </div>

              {/* Kota & Lokasi Tujuan Bongkar with PinIcon */}
              <div className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                  <RiMapPinLine className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground">
                      Kota & Lokasi Tujuan Bongkar
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        trip.unloadingDate
                          ? "border-emerald-500/30 bg-emerald-500/10 px-2 py-0 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
                          : "border-border bg-muted/60 px-2 py-0 text-[10px] font-semibold text-muted-foreground"
                      }
                    >
                      {trip.unloadingDate
                        ? "Selesai Bongkar"
                        : "Dalam Perjalanan"}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {trip.destinationCity}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trip.destinationName}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <RiCalendarLine className="size-3 text-muted-foreground" />
                    <span>
                      Tanggal Bongkar:{" "}
                      <strong className="font-semibold text-foreground">
                        {trip.unloadingDate
                          ? formatDateIndonesian(trip.unloadingDate, true)
                          : "Belum Bongkar"}
                      </strong>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Informasi Tonase & Tarif */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiScales3Line className="size-3.5 text-primary" />
              <span>Informasi Tonase & Tarif OA</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Tonase Muat
                </span>
                <p className="mt-1 text-base font-bold text-foreground tabular-nums sm:text-lg">
                  {loadedTon.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    Ton
                  </span>
                </p>
                <span className="text-[10px] text-muted-foreground">
                  Kapasitas muat awal
                </span>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Tonase Bongkar
                </span>
                <p className="mt-1 text-base font-bold text-foreground tabular-nums sm:text-lg">
                  {unloadedTon !== null ? (
                    <>
                      {unloadedTon.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        Ton
                      </span>
                    </>
                  ) : (
                    "-"
                  )}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  Timbangan bongkar
                </span>
              </div>

              <div className="col-span-2 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs sm:col-span-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Susut Tonase
                </span>
                <p
                  className={cn(
                    "mt-1 text-base font-bold tabular-nums sm:text-lg",
                    shrinkageTon !== null && shrinkageTon > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-foreground"
                  )}
                >
                  {shrinkageTon !== null ? (
                    <>
                      {shrinkageTon.toFixed(2)}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        Ton
                      </span>
                    </>
                  ) : (
                    "-"
                  )}
                </p>
                <span className="text-[10px] text-muted-foreground">
                  {shrinkageTon !== null && shrinkageTon > 0
                    ? "Selisih muat vs bongkar"
                    : "Tidak ada susut tonase"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-card/60 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-foreground">
                    Tarif OA per Ton:
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Tarif ongkos angkut acuan per ton untuk rute ini
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-foreground sm:text-sm">
                  {formatCurrency(ratePerTon)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    / Ton
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Keuangan & Operasional */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiWallet3Line className="size-3.5 text-primary" />
              <span>Keuangan & Operasional</span>
            </h4>
            <div className="space-y-4 rounded-2xl border border-border/80 bg-card p-4 shadow-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Omset Bruto */}
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Omset Bruto
                  </span>
                  <p className="text-base font-bold text-foreground tabular-nums sm:text-lg">
                    {formatCurrency(omset)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {loadedTon.toFixed(0)} Ton × {formatCurrency(ratePerTon)}
                  </span>
                </div>

                {/* Sangu Supir */}
                <div className="space-y-1 border-l border-border/60 pl-4">
                  <span className="text-xs text-muted-foreground">
                    Sangu Supir / Uang Jalan
                  </span>
                  <p className="text-base font-bold text-amber-600 tabular-nums sm:text-lg dark:text-amber-400">
                    {formatCurrency(sangu)}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    Uang jalan & solar operasional
                  </span>
                </div>
              </div>

              {/* Insentif Supir & Biaya DO Pihak Ketiga (jika ada) */}
              {(incentivePaid > 0 || hasFee) && (
                <div className="space-y-2.5 border-t border-border/60 pt-3">
                  {incentivePaid > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">
                          Insentif Supir:
                        </span>
                        {trip.incentiveStatus && (
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-[10px]"
                          >
                            {trip.incentiveStatus}
                          </Badge>
                        )}
                      </div>
                      <span className="font-mono font-semibold text-foreground">
                        {formatCurrency(incentivePaid)}
                      </span>
                    </div>
                  )}

                  {hasFee && (
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-muted-foreground">
                          Biaya DO Pihak Ke-3:
                        </span>
                        {trip.thirdPartyName && (
                          <p className="text-[10px] text-muted-foreground">
                            Pihak: {trip.thirdPartyName}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-foreground">
                          {formatCurrency(feeAmount)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-[10px]",
                            isPaid
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          )}
                        >
                          {trip.thirdPartyStatus || "Belum Bayar"}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rasio Bar Omset vs Sangu */}
              {omset > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Alokasi Pendapatan:</span>
                    <span className="font-mono font-medium">
                      {((sangu / omset) * 100).toFixed(1)}% Sangu :{" "}
                      {profitMarginPct}% Laba
                    </span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="bg-amber-500/80 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, (sangu / omset) * 100))}%`,
                      }}
                      title={`Sangu: ${formatCurrency(sangu)}`}
                    />
                    <div
                      className="bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, (profit / omset) * 100))}%`,
                      }}
                      title={`Laba: ${formatCurrency(profit)}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Rincian Potongan & Beban Khusus (Jika Ada) */}
          {totalDeductions > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <RiPercentLine className="size-3.5 text-primary" />
                <span>Rincian Potongan Khusus Pabrik</span>
              </h4>
              <div className="space-y-2 rounded-xl border border-border/80 bg-card p-3.5 text-xs shadow-2xs">
                {tax1 > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Pajak PPh (1%):
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(tax1)}
                    </span>
                  </div>
                )}
                {ded2Lju > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Potongan LJU (2%):
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(ded2Lju)}
                    </span>
                  </div>
                )}
                {ded5Uj > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Potongan UJ Grobogan (5%):
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(ded5Uj)}
                    </span>
                  </div>
                )}
                {meal > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Uang Makan:</span>
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(meal)}
                    </span>
                  </div>
                )}
                {savings > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Tabungan Supir:
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(savings)}
                    </span>
                  </div>
                )}
                {claim > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Klaim Perusahaan:
                    </span>
                    <span className="font-mono font-medium text-destructive">
                      {formatCurrency(claim)}
                    </span>
                  </div>
                )}
                {claimDriver > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Klaim Supir:</span>
                    <span className="font-mono font-medium text-destructive">
                      {formatCurrency(claimDriver)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border/60 pt-2 font-semibold">
                  <span>Total Potongan:</span>
                  <span className="font-mono text-destructive">
                    {formatCurrency(totalDeductions)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Highlight Estimasi Laba Bersih Hero Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-xs dark:bg-emerald-500/15">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Laba Bersih Ritase
                  </span>
                  {omset > 0 && (
                    <Badge
                      variant="outline"
                      className="py-0.2 border-emerald-500/40 bg-emerald-500/20 px-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                    >
                      {profitMarginPct}% Margin
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Kalkulasi: Omset ({formatCurrency(omset)}) − Beban Operasional
                  ({formatCurrency(omset - profit)})
                </p>
              </div>
              <span className="font-mono text-xl font-bold tracking-tight text-emerald-600 sm:text-2xl dark:text-emerald-400">
                {formatCurrency(profit)}
              </span>
            </div>
          </div>

          {/* Section 6: Catatan Tambahan (Jika Ada) */}
          {trip.notes && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <RiFileTextLine className="size-3.5 text-primary" />
                <span>Catatan Tambahan</span>
              </h4>
              <div className="rounded-xl border border-border/80 bg-card p-3.5 text-xs leading-relaxed whitespace-pre-wrap text-foreground shadow-2xs">
                {trip.notes}
              </div>
            </div>
          )}
        </div>

        {/* Pinned Footer Actions */}
        <div className="shrink-0 border-t border-border/80 bg-card/90 p-4 backdrop-blur-md sm:px-6 sm:py-4">
          {/* Mobile Layout (< sm) */}
          <div className="flex flex-col gap-2 sm:hidden">
            {onEdit && (
              <Button
                type="button"
                size="default"
                onClick={() => {
                  onOpenChange(false)
                  onEdit(trip)
                }}
                className="h-10 w-full gap-1.5 text-xs font-semibold shadow-xs transition-all hover:shadow-sm"
              >
                <RiEditLine className="size-4" />
                <span>Ubah Ritase</span>
              </Button>
            )}
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
          <div className="hidden sm:flex sm:items-center sm:justify-end sm:gap-2">
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
                  onEdit(trip)
                }}
                className="h-10 gap-2 px-5 text-xs font-semibold shadow-xs transition-all hover:shadow-sm"
              >
                <RiEditLine className="size-4" />
                <span>Ubah Ritase</span>
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
