"use client"

import * as React from "react"
import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiMapPinLine,
  RiPercentLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FactoryIcon } from "@/components/icons"
import { isIndocementRoute } from "@/features/rates/rates.indocement"
import {
  cn,
  formatCityWithCode,
  formatCurrency,
  formatPercentage,
} from "@/lib/utils"
import type { RateReference } from "@/db/schema"

interface RateMobileCardProps {
  rate: RateReference
  onViewDetail?: (rate: RateReference) => void
  onEdit?: (rate: RateReference) => void
  onToggleStatus?: (rate: RateReference) => void
  onDelete?: (rate: RateReference) => void
}

export function RateMobileCard({
  rate,
  onViewDetail,
  onEdit,
  onToggleStatus,
  onDelete,
}: RateMobileCardProps) {
  const numRate = parseFloat(rate.ratePerTon)
  const numPct = parseFloat(rate.sanguPercentage)
  const numTon = parseFloat(rate.standardTonnage || "31")

  const isIndocement = isIndocementRoute(rate)

  const rowJumlah =
    isIndocement && rate.estimatedRevenue
      ? parseFloat(rate.estimatedRevenue)
      : Math.round(numRate * numTon)

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

  const rowSangu =
    parsedDefaultSangu > 0 && !isLegacyThousandRounding
      ? parsedDefaultSangu
      : formulaSangu

  const rowProfit =
    isIndocement && rate.estimatedProfitTotal
      ? parseFloat(rate.estimatedProfitTotal)
      : rowJumlah - rowSangu

  const additionalRate = parseFloat(rate.additionalTonnageRate || "0")

  const distanceNum = rate.distanceKm ? parseFloat(rate.distanceKm) : 0
  const cleanCity = rate.city.trim().toLowerCase()
  const cleanDest = rate.destination.trim().toLowerCase()
  const cleanCityWithCode = formatCityWithCode(rate.city, rate.cityCode)
    .trim()
    .toLowerCase()
  const isDifferentDestination =
    Boolean(cleanDest) &&
    cleanDest !== cleanCity &&
    cleanDest !== cleanCityWithCode

  return (
    <Card className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs transition-all hover:border-primary/30">
      <CardContent className="space-y-3 p-4">
        {/* Header Section: Pabrik Asal, Status, & Tujuan Pengiriman */}
        <div className="space-y-2">
          {/* Top Bar: Pabrik Asal & Status */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <Badge
                variant="outline"
                className="max-w-full gap-1.5 border-primary/25 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary"
              >
                <FactoryIcon className="size-3 shrink-0 text-amber-500 dark:text-amber-400" />
                <span className="truncate">
                  {rate.originPlant || rate.clientName}
                </span>
              </Badge>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {rate.hasSpecialDeductions && (
                <Badge
                  variant="secondary"
                  className="bg-purple-500/10 text-[10px] font-medium text-purple-700 dark:text-purple-300"
                >
                  <RiPercentLine className="mr-0.5 size-3" />
                  LJU
                </Badge>
              )}
              <Badge
                variant={rate.isActive ? "default" : "outline"}
                className={`text-[10px] font-medium ${
                  rate.isActive
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "text-muted-foreground"
                }`}
              >
                {rate.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </div>

          {/* Destination Block: Kota Tujuan & Detail Lokasi Bongkar */}
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <RiMapPinLine className="size-3.5 shrink-0 text-primary" />
              <span className="text-sm font-bold text-foreground">
                {formatCityWithCode(rate.city, rate.cityCode)}
              </span>
              {rate.zoneCode && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  (Zone: {rate.zoneCode})
                </span>
              )}
              {distanceNum > 0 && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  • {distanceNum} km
                </span>
              )}
            </div>
            {isDifferentDestination && (
              <p className="truncate pl-5 text-xs font-medium text-muted-foreground">
                {rate.destination}
              </p>
            )}
          </div>
        </div>

        {/* Rate, Jumlah, Sangu & Profit Details Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <span className="text-[10px] text-muted-foreground">
              Tarif OA / Ton
            </span>
            <div className="font-mono font-medium text-foreground">
              {formatCurrency(numRate)}
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <span className="text-[10px] text-muted-foreground">
              Est. Jumlah ({numTon}t)
            </span>
            <div className="font-mono font-medium text-foreground">
              {formatCurrency(rowJumlah)}
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <span className="text-[10px] text-muted-foreground">
              Sangu Supir ({formatPercentage(rate.sanguPercentage)})
            </span>
            <div className="font-mono font-semibold text-primary">
              {formatCurrency(rowSangu)}
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5">
            <span className="text-[10px] text-muted-foreground">
              Est. Profit
            </span>
            <div
              className={`font-mono font-semibold ${
                rowProfit > 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : rowProfit < 0
                    ? "text-destructive"
                    : "text-foreground"
              }`}
            >
              {formatCurrency(rowProfit)}
            </div>
          </div>
        </div>

        {/* Informasi Tarif Lebih Tonase jika ada */}
        {additionalRate > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5 text-xs">
            <span className="text-[11px] text-muted-foreground">
              Tarif Lebih Tonase
            </span>
            <span className="font-mono font-medium text-foreground">
              +{formatCurrency(additionalRate)} / Ton
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
          {onViewDetail ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(rate)}
              className="h-8 gap-1.5 rounded-lg border-border/70 px-2.5 text-xs font-medium text-foreground shadow-2xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <RiEyeLine className="size-3.5 text-muted-foreground" />
              <span>Detail</span>
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1.5">
            {onToggleStatus && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onToggleStatus(rate)}
                title={rate.isActive ? "Nonaktifkan rute" : "Aktifkan rute"}
                aria-label={
                  rate.isActive ? "Nonaktifkan rute" : "Aktifkan rute"
                }
                className={cn(
                  "size-8 rounded-lg shadow-2xs transition-colors",
                  rate.isActive
                    ? "border-amber-500/30 text-amber-600 hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                    : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 dark:text-emerald-400"
                )}
              >
                {rate.isActive ? (
                  <RiCloseLine className="size-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <RiCheckLine className="size-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </Button>
            )}

            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onEdit(rate)}
                title="Ubah referensi rute"
                aria-label="Ubah referensi rute"
                className="size-8 rounded-lg border-border/70 text-muted-foreground shadow-2xs transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
              >
                <RiEditLine className="size-3.5" />
              </Button>
            )}

            {onDelete && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => onDelete(rate)}
                title="Hapus referensi rute"
                aria-label="Hapus referensi rute"
                className="size-8 rounded-lg border-destructive/30 text-destructive shadow-2xs transition-colors hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive"
              >
                <RiDeleteBinLine className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
