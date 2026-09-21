"use client"

import * as React from "react"
import {
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMapPinLine,
  RiPercentLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import type { RateReference } from "@/db/schema"

interface RateMobileCardProps {
  rate: RateReference
  onEdit?: (rate: RateReference) => void
  onToggleStatus?: (rate: RateReference) => void
  onDelete?: (rate: RateReference) => void
}

export function RateMobileCard({
  rate,
  onEdit,
  onToggleStatus,
  onDelete,
}: RateMobileCardProps) {
  const numRate = parseFloat(rate.ratePerTon)
  const numPct = parseFloat(rate.sanguPercentage)
  const numTon = parseFloat(rate.standardTonnage)
  const estimatedSangu = Math.round((numRate * numTon * numPct) / 1000) * 1000

  return (
    <Card className="overflow-hidden border border-border shadow-xs">
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

        {/* Rate & Sangu Details Grid */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded border border-border/70 p-2">
            <span className="text-[10px] text-muted-foreground">
              Tarif / Ton
            </span>
            <div className="font-mono font-medium text-foreground">
              {formatCurrency(numRate)}
            </div>
          </div>
          <div className="rounded border border-border/70 p-2">
            <span className="text-[10px] text-muted-foreground">% Sangu</span>
            <div className="font-mono font-medium text-foreground">
              {(numPct * 100).toFixed(1)}%
            </div>
          </div>
          <div className="rounded border border-border/70 p-2">
            <span className="text-[10px] text-muted-foreground">
              Acuan UJ ({rate.standardTonnage || "31"}t)
            </span>
            <div className="font-mono font-bold text-primary">
              {rate.defaultSangu
                ? formatCurrency(parseFloat(rate.defaultSangu))
                : formatCurrency(estimatedSangu)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-1.5 border-t border-border pt-2.5">
          {onToggleStatus && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleStatus(rate)}
              className="h-7 gap-1 px-2 text-[11px]"
            >
              {rate.isActive ? (
                <>
                  <RiCloseLine className="size-3 text-destructive" />
                  <span>Nonaktifkan</span>
                </>
              ) : (
                <>
                  <RiCheckLine className="size-3 text-emerald-600" />
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
              className="h-7 gap-1 px-2 text-[11px]"
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
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Hapus Tarif"
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
