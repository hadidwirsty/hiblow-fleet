"use client"

import {
  RiCalendarLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFlightLandLine,
  RiFlightTakeoffLine,
  RiMapPinLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { TripRecord } from "@/features/trips/trips-table"
import { isDoFeePaid } from "@/features/trips/trips.filter"
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"

interface TripMobileCardProps {
  trip: TripRecord
  originPlant?: string
  onEdit?: (trip: TripRecord) => void
  onDelete?: (trip: TripRecord) => void
  onEditFee?: (trip: TripRecord) => void
}

function formatPlateNumber(truckId: string): string {
  if (truckId === "W8187UA") return "W 8187 UA"
  if (truckId === "H8133OF") return "H 8133 OF"
  return truckId
}

function getDriverName(truckId: string): string {
  if (truckId === "W8187UA") return "Triyono"
  if (truckId === "H8133OF") return "Khoirul"
  return "Supir"
}

export function TripMobileCard({
  trip,
  originPlant = "-",
  onEdit,
  onDelete,
}: TripMobileCardProps) {
  const omsetNum = parseFloat(trip.omset || "0")
  const sanguNum = parseFloat(trip.sangu || "0")
  const profitNum = parseFloat(trip.profit || "0")
  const rateNum = parseFloat(trip.ratePerTon || "0")
  const loadedTonnageNum = trip.loadedTonnage
    ? parseFloat(trip.loadedTonnage)
    : 31.0
  const unloadedTonnageNum =
    trip.unloadingDate && parseFloat(trip.unloadedTonnage || "0") > 0
      ? parseFloat(trip.unloadedTonnage)
      : null
  const feeAmount = parseFloat(trip.thirdPartyFee || "0")
  const hasFee = feeAmount > 0 || Boolean(trip.thirdPartyName)
  const isPaid = isDoFeePaid(trip.thirdPartyStatus)
  const driverName = getDriverName(trip.truckId)
  const plateNumber = formatPlateNumber(trip.truckId)

  return (
    <Card className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs transition-all hover:border-primary/30">
      <CardContent className="space-y-3 p-4">
        {/* Top Header: Order Number, Supir - Armada Badge, & Tgl Order */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-sm font-bold text-foreground">
              {trip.orderNumber.startsWith("#")
                ? trip.orderNumber
                : `#${trip.orderNumber}`}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">
                {driverName}
              </span>
              <Badge
                variant="outline"
                className={
                  trip.truckId === "W8187UA"
                    ? "border-primary/40 bg-primary/10 font-mono text-[10px] font-semibold text-primary"
                    : "border-amber-500/40 bg-amber-500/10 font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                }
              >
                {plateNumber}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <RiCalendarLine className="size-3.5" />
            <span>{formatDateIndonesian(trip.orderDate, true)}</span>
          </div>
        </div>

        {/* Origin & Destination Information Box */}
        <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-2.5">
          {/* Pabrik Asal */}
          <div className="flex items-start gap-1.5 text-xs">
            <RiFlightTakeoffLine className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-muted-foreground">
                Pabrik Asal:
              </span>
              <div className="truncate font-medium text-foreground">
                {originPlant}
              </div>
            </div>
          </div>

          {/* Kota & Pabrik Tujuan */}
          <div className="flex items-start gap-1.5 border-t border-border/40 pt-1.5 text-xs">
            <RiMapPinLine className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-foreground">
                {trip.destinationCity}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {trip.destinationName}
              </div>
            </div>
          </div>

          {/* Tgl Bongkar (Jika Ada) */}
          <div className="flex items-center justify-between border-t border-border/40 pt-1.5 text-[11px]">
            <span className="flex items-center gap-1 text-muted-foreground">
              <RiFlightLandLine className="size-3" />
              <span>Tgl Bongkar:</span>
            </span>
            <span className="font-medium text-foreground">
              {trip.unloadingDate
                ? formatDateIndonesian(trip.unloadingDate, true)
                : "- (Belum Bongkar)"}
            </span>
          </div>
        </div>

        {/* Technical & Financial 2-Column Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Tonase Muatan */}
          <div className="rounded-lg border border-border/70 bg-card/60 p-2">
            <span className="text-[10px] text-muted-foreground">
              Tonase Muatan (Ton)
            </span>
            <div className="font-mono font-medium text-foreground">
              {loadedTonnageNum.toFixed(2)} Ton
            </div>
          </div>

          {/* Tonase Bongkar */}
          <div className="rounded-lg border border-border/70 bg-card/60 p-2">
            <span className="text-[10px] text-muted-foreground">
              Tonase Bongkar (Ton)
            </span>
            <div className="font-mono font-medium text-foreground">
              {unloadedTonnageNum !== null
                ? `${unloadedTonnageNum.toFixed(2)} Ton`
                : "-"}
            </div>
          </div>

          {/* Tarif / Ton */}
          <div className="rounded-lg border border-border/70 bg-card/60 p-2">
            <span className="text-[10px] text-muted-foreground">
              Tarif / Ton
            </span>
            <div className="font-mono font-medium text-foreground">
              {formatCurrency(rateNum)}
            </div>
          </div>

          {/* Sangu Supir / Uang Jalan */}
          <div className="rounded-lg border border-border/70 bg-card/60 p-2">
            <span className="text-[10px] text-muted-foreground">
              Sangu Supir / Uang Jalan
            </span>
            <div className="font-mono font-medium text-foreground">
              {formatCurrency(sanguNum)}
            </div>
          </div>

          {/* Omset Bruto */}
          <div className="col-span-2 rounded-lg border border-border/70 bg-card/60 p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                Omset Bruto
              </span>
              <span className="font-mono text-xs font-bold text-foreground">
                {formatCurrency(omsetNum)}
              </span>
            </div>
          </div>
        </div>

        {/* Profit Highlight Banner */}
        <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-xs dark:bg-emerald-500/15">
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
            Laba Bersih:
          </span>
          <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
            {formatCurrency(profitNum)}
          </span>
        </div>

        {/* Biaya DO Pihak Ke-3 Section */}
        {hasFee && (
          <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Biaya DO Pihak Ke-3:
                </span>
                <span className="font-mono text-xs font-semibold text-foreground">
                  {formatCurrency(feeAmount)}
                </span>
                {trip.thirdPartyName && (
                  <span className="text-[11px] text-muted-foreground">
                    ({trip.thirdPartyName})
                  </span>
                )}
              </div>
              <div>
                <Badge
                  variant="outline"
                  className={`px-1.5 py-0 text-[10px] font-normal ${
                    isPaid
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {isPaid ? "Lunas" : "Belum Bayar"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {(onEdit || onDelete) && (
          <div className="flex items-center justify-end gap-1.5 border-t border-border/60 pt-2.5">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(trip)}
                className="h-7 gap-1 px-2.5 text-[11px]"
              >
                <RiEditLine className="size-3" />
                <span>Ubah</span>
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(trip)}
                className="size-7 text-muted-foreground hover:text-destructive"
                title="Hapus Ritase"
              >
                <RiDeleteBinLine className="size-3.5" />
                <span className="sr-only">Hapus</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
