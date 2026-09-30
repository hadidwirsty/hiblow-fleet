"use client"

import * as React from "react"
import {
  RiCalendarLine,
  RiEditLine,
  RiFileTextLine,
  RiFlightLandLine,
  RiFlightTakeoffLine,
  RiMapPinLine,
  RiPercentLine,
  RiScales3Line,
  RiTruckLine,
  RiWallet3Line,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { formatPlateNumber, getDriverAndTruck } from "@/domain/trucks"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
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
  const incentiveRate = parseFloat(trip.incentiveRate || "0")

  const formattedOrderNumber = trip.orderNumber.startsWith("#")
    ? trip.orderNumber
    : `#${trip.orderNumber}`

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
                <RiTruckLine className="size-4" />
              </span>
              <SheetTitle className="font-mono text-base font-bold tracking-tight text-foreground sm:text-lg">
                {formattedOrderNumber}
              </SheetTitle>
              <Badge
                variant="outline"
                className={
                  trip.truckId === "W8187UA"
                    ? "border-primary/40 bg-primary/10 font-mono text-[11px] font-semibold text-primary"
                    : "border-amber-500/40 bg-amber-500/10 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                }
              >
                {driverInfo.driver} — {driverInfo.plate}
              </Badge>
            </div>
            <SheetDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RiCalendarLine className="size-3.5 shrink-0" />
              <span>
                Tanggal Order: {formatDateIndonesian(trip.orderDate, true)}
              </span>
            </SheetDescription>
          </div>
        </SheetHeader>

        {/* Content Body */}
        <div className="space-y-5 p-4 sm:p-6">
          {/* Section 1: Rute Pengiriman */}
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
                    {originPlant}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-border/50 pt-2.5">
                <RiFlightLandLine className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] text-muted-foreground">
                    Kota & Lokasi Tujuan Bongkar
                  </span>
                  <p className="text-xs font-semibold text-foreground sm:text-sm">
                    {trip.destinationCity}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trip.destinationName}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-2.5 text-xs">
                <span className="text-muted-foreground">Tanggal Bongkar:</span>
                <span className="font-medium text-foreground">
                  {trip.unloadingDate
                    ? formatDateIndonesian(trip.unloadingDate, true)
                    : "Belum Bongkar"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Tonase & Tarif */}
          <div className="space-y-2.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiScales3Line className="size-3.5 text-primary" />
              <span>Informasi Tonase & Tarif</span>
            </h4>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
                <span className="block text-[11px] text-muted-foreground">
                  Tonase Muat
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {loadedTon.toFixed(2)} Ton
                </span>
              </div>

              <div className="rounded-lg border border-border/70 bg-card p-3 shadow-2xs">
                <span className="block text-[11px] text-muted-foreground">
                  Tonase Bongkar
                </span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  {unloadedTon !== null ? `${unloadedTon.toFixed(2)} Ton` : "-"}
                </span>
              </div>

              <div className="col-span-2 rounded-lg border border-border/70 bg-card p-3 shadow-2xs sm:col-span-1">
                <span className="block text-[11px] text-muted-foreground">
                  Susut Tonase
                </span>
                <span
                  className={`font-mono text-sm font-semibold ${
                    shrinkageTon !== null && shrinkageTon > 0
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {shrinkageTon !== null
                    ? `${shrinkageTon.toFixed(2)} Ton`
                    : "-"}
                </span>
              </div>

              <div className="col-span-2 rounded-lg border border-border/70 bg-card p-3 shadow-2xs sm:col-span-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Tarif OA per Ton
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {formatCurrency(ratePerTon)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Ringkasan Finansial Operasional */}
          <div className="space-y-2.5">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiWallet3Line className="size-3.5 text-primary" />
              <span>Keuangan & Operasional</span>
            </h4>
            <div className="space-y-2 rounded-xl border border-border/80 bg-card p-3.5 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Omset Bruto:</span>
                <span className="font-mono font-bold text-foreground">
                  {formatCurrency(omset)}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                <span className="text-muted-foreground">
                  Sangu Supir / Uang Jalan:
                </span>
                <span className="font-mono font-semibold text-foreground">
                  {formatCurrency(sangu)}
                </span>
              </div>

              {incentivePaid > 0 && (
                <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
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
                <div className="flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">
                      Biaya DO Pihak Ke-3:
                    </span>
                    {trip.thirdPartyName && (
                      <span className="text-[10px] text-muted-foreground">
                        Pihak: {trip.thirdPartyName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-semibold text-foreground">
                      {formatCurrency(feeAmount)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`px-1.5 py-0 text-[10px] ${
                        isPaid
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {trip.thirdPartyStatus || "Belum Bayar"}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Rincian Potongan & Klaim (Jika Ada) */}
          {totalDeductions > 0 && (
            <div className="space-y-2.5">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <RiPercentLine className="size-3.5 text-primary" />
                <span>Rincian Potongan & Beban Khusus</span>
              </h4>
              <div className="space-y-1.5 rounded-xl border border-border/80 bg-muted/20 p-3.5 text-xs shadow-2xs">
                {tax1 > 0 && (
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">
                      Pajak PPh (1%):
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(tax1)}
                    </span>
                  </div>
                )}
                {ded2Lju > 0 && (
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">
                      Potongan LJU (2%):
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(ded2Lju)}
                    </span>
                  </div>
                )}
                {ded5Uj > 0 && (
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">
                      Potongan UJ Grobogan (5%):
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(ded5Uj)}
                    </span>
                  </div>
                )}
                {meal > 0 && (
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">Uang Makan:</span>
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(meal)}
                    </span>
                  </div>
                )}
                {savings > 0 && (
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">
                      Tabungan Supir:
                    </span>
                    <span className="font-mono font-medium text-foreground">
                      {formatCurrency(savings)}
                    </span>
                  </div>
                )}
                {claim > 0 && (
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">
                      Klaim Perusahaan:
                    </span>
                    <span className="font-mono font-medium text-destructive">
                      {formatCurrency(claim)}
                    </span>
                  </div>
                )}
                {claimDriver > 0 && (
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-muted-foreground">Klaim Supir:</span>
                    <span className="font-mono font-medium text-destructive">
                      {formatCurrency(claimDriver)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-border/60 pt-1.5 font-semibold">
                  <span>Total Potongan:</span>
                  <span className="font-mono text-destructive">
                    {formatCurrency(totalDeductions)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Highlight Laba Bersih */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 shadow-2xs dark:bg-emerald-500/15">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="block text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  Laba Bersih Ritase
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Pendapatan bersih setelah dikurangi seluruh beban operasional
                </span>
              </div>
              <span className="shrink-0 font-mono text-lg font-bold text-emerald-700 sm:text-xl dark:text-emerald-400">
                {formatCurrency(profit)}
              </span>
            </div>
          </div>

          {/* Section 6: Catatan / Keterangan (Jika Ada) */}
          {trip.notes && (
            <div className="space-y-1.5">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <RiFileTextLine className="size-3.5 text-primary" />
                <span>Catatan Tambahan</span>
              </h4>
              <div className="rounded-lg border border-border/80 bg-muted/30 p-3 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
                {trip.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer Drawer Responsif */}
        <SheetFooter className="border-t bg-muted/20 p-4">
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:justify-between sm:gap-2">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onEdit(trip)
                }}
                className="w-full justify-center gap-1.5 text-xs sm:w-auto"
              >
                <RiEditLine className="size-3.5" />
                <span>Edit Ritase</span>
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
              className={cn(
                "w-full justify-center text-xs sm:w-auto",
                !onEdit && "col-span-2"
              )}
            >
              Tutup
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
