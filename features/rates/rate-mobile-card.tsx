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
import { cn, formatCurrency, formatPercentage } from "@/lib/utils"
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

  const rowSangu =
    parsedDefaultSangu > 0 && !isLegacyThousandRounding
      ? parsedDefaultSangu
      : formulaSangu
  const rowProfit = rowJumlah - rowSangu

  return (
    <Card className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs transition-all hover:border-primary/30">
      <CardContent className="space-y-3 p-4">
        {/* Top: City, Client & Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/5 text-[10px] font-semibold text-primary"
              >
                {rate.originPlant || rate.clientName}
              </Badge>
              <span className="text-sm font-bold text-foreground">
                {rate.city}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <RiMapPinLine className="size-3 shrink-0 text-primary" />
              <span className="font-medium text-foreground">
                {rate.destination}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {rate.hasSpecialDeductions && (
              <Badge
                variant="secondary"
                className="bg-purple-500/10 text-[10px] text-purple-700 dark:text-purple-300"
              >
                <RiPercentLine className="mr-0.5 size-3" />
                LJU
              </Badge>
            )}
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

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 border-t border-border/60 pt-2.5">
          {onViewDetail && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(rate)}
              className="h-7 gap-1 px-2.5 text-[11px] font-medium shadow-2xs hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <RiEyeLine className="size-3" />
              <span>Detail</span>
            </Button>
          )}
          {onToggleStatus && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(rate)}
              className={cn(
                "h-7 gap-1 px-2.5 text-[11px] font-medium shadow-2xs transition-colors",
                rate.isActive
                  ? "hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-700 dark:text-emerald-400"
              )}
            >
              {rate.isActive ? (
                <>
                  <RiCloseLine className="size-3 text-destructive" />
                  <span>Nonaktifkan</span>
                </>
              ) : (
                <>
                  <RiCheckLine className="size-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Aktifkan</span>
                </>
              )}
            </Button>
          )}
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(rate)}
              className="h-7 gap-1 px-2.5 text-[11px] font-medium shadow-2xs hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <RiEditLine className="size-3" />
              <span>Edit</span>
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(rate)}
              className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Hapus Rute"
            >
              <RiDeleteBinLine className="size-3.5" />
              <span className="sr-only">Hapus</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
