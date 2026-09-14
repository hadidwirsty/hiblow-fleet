"use client"

import * as React from "react"
import { RiEditLine, RiMapPinLine, RiCalendarLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"
import type { TripRecord } from "@/features/trips/trips-table"

interface TripMobileCardProps {
  trip: TripRecord
  onEditFee?: (trip: TripRecord) => void
}

function formatPlateNumber(truckId: string): string {
  if (truckId === "W8187UA") return "W 8187 UA"
  if (truckId === "H8133OF") return "H 8133 OF"
  return truckId
}

export function TripMobileCard({ trip, onEditFee }: TripMobileCardProps) {
  const omsetNum = parseFloat(trip.omset || "0")
  const sanguNum = parseFloat(trip.sangu || "0")
  const profitNum = parseFloat(trip.profit || "0")
  const rateNum = parseFloat(trip.ratePerTon || "0")
  const tonnageNum = parseFloat(trip.unloadedTonnage || "0")
  const feeAmount = parseFloat(trip.thirdPartyFee || "0")
  const hasFee = feeAmount > 0 || Boolean(trip.thirdPartyName)

  const isFeePaid =
    trip.thirdPartyStatus?.toLowerCase().includes("lunas") ||
    trip.thirdPartyStatus?.toLowerCase().includes("sudah dibayar") ||
    trip.thirdPartyStatus?.toLowerCase().includes("sdh dibayar")

  return (
    <Card className="overflow-hidden border border-border shadow-xs">
      <CardContent className="space-y-3 p-4">
        {/* Top Header: Order Number, Truck Badge & Order Date */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-foreground">
              #{trip.orderNumber}
            </span>
            <Badge
              variant="outline"
              className={
                trip.truckId === "W8187UA"
                  ? "border-primary/40 bg-primary/10 font-mono text-[11px] font-semibold text-primary"
                  : "border-amber-500/40 bg-amber-500/10 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400"
              }
            >
              {formatPlateNumber(trip.truckId)}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <RiCalendarLine className="size-3.5" />
            <span>{formatDateIndonesian(trip.orderDate, true)}</span>
          </div>
        </div>

        {/* Destination Info */}
        <div className="rounded-md bg-muted/40 p-2.5">
          <div className="flex items-start gap-1.5">
            <RiMapPinLine className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-foreground">
                {trip.destinationCity}
              </div>
              <div className="truncate text-[11px] text-muted-foreground">
                {trip.destinationName}
              </div>
            </div>
          </div>
          {trip.unloadingDate && (
            <div className="mt-1.5 flex items-center justify-between border-t border-border/60 pt-1 text-[10px] text-muted-foreground">
              <span>Tgl Bongkar:</span>
              <span className="font-medium text-foreground">
                {formatDateIndonesian(trip.unloadingDate, true)}
              </span>
            </div>
          )}
        </div>

        {/* Financial & Tonnage 2-Column Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-border/70 p-2">
            <span className="text-[10px] text-muted-foreground">
              Muatan Bongkar
            </span>
            <div className="font-mono font-medium text-foreground">
              {tonnageNum.toFixed(2)} ton
            </div>
          </div>
          <div className="rounded border border-border/70 p-2">
            <span className="text-[10px] text-muted-foreground">
              Tarif / Ton
            </span>
            <div className="font-mono font-medium text-foreground">
              {formatCurrency(rateNum)}
            </div>
          </div>
          <div className="rounded border border-border/70 p-2">
            <span className="text-[10px] text-muted-foreground">
              Omset Bruto
            </span>
            <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(omsetNum)}
            </div>
          </div>
          <div className="rounded border border-border/70 p-2">
            <span className="text-[10px] text-muted-foreground">
              Sangu Supir
            </span>
            <div className="font-mono font-medium text-foreground">
              {formatCurrency(sanguNum)}
            </div>
          </div>
        </div>

        {/* Profit Highlight Banner */}
        <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2 text-xs dark:bg-emerald-500/15">
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
            Estimasi Laba Ritase:
          </span>
          <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
            {formatCurrency(profitNum)}
          </span>
        </div>

        {/* Third Party Fee & Status Section */}
        {hasFee && (
          <div className="flex items-center justify-between border-t border-border pt-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Fee DO:
                </span>
                <span className="font-mono text-xs font-semibold text-foreground">
                  {formatCurrency(feeAmount)}
                </span>
                {trip.thirdPartyName && (
                  <span className="max-w-28 truncate text-[10px] text-muted-foreground">
                    ({trip.thirdPartyName})
                  </span>
                )}
              </div>
              <div>
                <Badge
                  variant="outline"
                  className={`px-1.5 py-0 text-[10px] font-normal ${
                    isFeePaid
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {trip.thirdPartyStatus || "Belum Dibayar"}
                </Badge>
              </div>
            </div>

            {onEditFee && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEditFee(trip)}
                className="h-7 gap-1 px-2 text-[11px]"
              >
                <RiEditLine className="size-3" />
                <span>Ubah Status</span>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
