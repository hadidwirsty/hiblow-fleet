"use client"

import * as React from "react"
import {
  RiCalendarLine,
  RiDeleteBinLine,
  RiEditLine,
  RiMapPinLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"
import type { ExpenseRecord } from "@/features/expenses/expenses-table"

interface ExpenseMobileCardProps {
  expense: ExpenseRecord
  onEdit?: (expense: ExpenseRecord) => void
  onDelete?: (expense: ExpenseRecord) => void
}

function formatPlateNumber(truckId: string): string {
  if (truckId === "W8187UA") return "W 8187 UA"
  if (truckId === "H8133OF") return "H 8133 OF"
  return truckId
}

function getCategoryBadge(category: string) {
  switch (category) {
    case "Servis":
      return (
        <Badge
          variant="outline"
          className="border-rose-500/30 bg-rose-500/10 text-[10px] font-medium text-rose-600 dark:text-rose-400"
        >
          Servis
        </Badge>
      )
    case "Onderdil":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 bg-amber-500/10 text-[10px] font-medium text-amber-600 dark:text-amber-400"
        >
          Onderdil
        </Badge>
      )
    case "BBM":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500/30 bg-yellow-500/10 text-[10px] font-medium text-yellow-600 dark:text-yellow-400"
        >
          BBM
        </Badge>
      )
    case "GPS":
      return (
        <Badge
          variant="outline"
          className="border-cyan-500/30 bg-cyan-500/10 text-[10px] font-medium text-cyan-600 dark:text-cyan-400"
        >
          GPS
        </Badge>
      )
    case "DP/Cicilan":
      return (
        <Badge
          variant="outline"
          className="border-indigo-500/30 bg-indigo-500/10 text-[10px] font-medium text-indigo-600 dark:text-indigo-400"
        >
          DP/Cicilan
        </Badge>
      )
    case "Administrasi":
      return (
        <Badge
          variant="outline"
          className="border-slate-500/30 bg-slate-500/10 text-[10px] font-medium text-slate-600 dark:text-slate-400"
        >
          Administrasi
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-[10px]">
          {category}
        </Badge>
      )
  }
}

export function ExpenseMobileCard({
  expense,
  onEdit,
  onDelete,
}: ExpenseMobileCardProps) {
  const amountNum = parseFloat(expense.amount || "0")
  const adminNum = parseFloat(expense.adminFee || "0")
  const totalBeban = amountNum + adminNum

  return (
    <Card className="overflow-hidden border border-border shadow-xs">
      <CardContent className="space-y-3 p-4">
        {/* Top: Date & Badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={
                expense.truckId === "W8187UA"
                  ? "border-primary/40 bg-primary/10 font-mono text-[11px] font-semibold text-primary"
                  : "border-amber-500/40 bg-amber-500/10 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400"
              }
            >
              {formatPlateNumber(expense.truckId)}
            </Badge>
            {getCategoryBadge(expense.category)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <RiCalendarLine className="size-3.5" />
            <span>{formatDateIndonesian(expense.expenseDate, true)}</span>
          </div>
        </div>

        {/* Description & Location */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">
            {expense.description}
          </p>
          {expense.location && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <RiMapPinLine className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{expense.location}</span>
            </div>
          )}
          {expense.repairNotes && (
            <div className="rounded bg-muted/40 p-2 text-[11px] text-muted-foreground">
              📝 {expense.repairNotes}
            </div>
          )}
        </div>

        {/* Financial Details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-border/70 p-2">
            <span className="text-[10px] text-muted-foreground">
              Biaya Pokok
            </span>
            <div className="font-mono font-medium text-foreground">
              {formatCurrency(amountNum)}
            </div>
          </div>
          <div className="rounded border border-border/70 p-2">
            <span className="text-[10px] text-muted-foreground">
              Admin Bank
            </span>
            <div className="font-mono font-medium text-foreground">
              {adminNum > 0 ? formatCurrency(adminNum) : "-"}
            </div>
          </div>
        </div>

        {/* Total & Action Buttons */}
        <div className="flex items-center justify-between border-t border-border pt-2.5">
          <div>
            <span className="text-[10px] text-muted-foreground">
              Total Beban:
            </span>
            <div className="font-mono text-sm font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalBeban)}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(expense)}
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
                onClick={() => onDelete(expense)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                title="Hapus Pengeluaran"
              >
                <RiDeleteBinLine className="size-3.5" />
                <span className="sr-only">Hapus</span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
