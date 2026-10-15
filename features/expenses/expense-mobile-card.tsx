"use client"

import * as React from "react"
import {
  RiCalendarLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiMapPinLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatPlateNumber, getDriverAndTruck } from "@/domain/trucks"
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"

import type { ExpenseRecord } from "@/features/expenses/expenses-table"

interface ExpenseMobileCardProps {
  expense: ExpenseRecord
  onViewDetail?: (expense: ExpenseRecord) => void
  onEdit?: (expense: ExpenseRecord) => void
  onDelete?: (expense: ExpenseRecord) => void
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
          className="border-blue-500/30 bg-blue-500/10 text-[10px] font-medium text-blue-600 dark:text-blue-400"
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
  onViewDetail,
  onEdit,
  onDelete,
}: ExpenseMobileCardProps) {
  const amountNum = parseFloat(String(expense.amount) || "0")
  const adminNum = parseFloat(String(expense.adminFee) || "0")
  const totalBeban = amountNum + adminNum
  const driverInfo = getDriverAndTruck(expense.truckId)

  return (
    <Card className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs transition-all hover:border-primary/30">
      <CardContent className="space-y-3 p-4">
        {/* Top Header: Supir - Armada Badge, Kategori, & Tanggal */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-foreground">
                {driverInfo.driver}
              </span>
              <Badge
                variant="outline"
                className={
                  expense.truckId === "W8187UA"
                    ? "border-primary/40 bg-primary/10 font-mono text-[10px] font-semibold text-primary"
                    : "border-amber-500/40 bg-amber-500/10 font-mono text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                }
              >
                {formatPlateNumber(expense.truckId)}
              </Badge>
              {getCategoryBadge(expense.category)}
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <RiCalendarLine className="size-3.5" />
            <span>{formatDateIndonesian(expense.expenseDate, true)}</span>
          </div>
        </div>

        {/* Deskripsi & Lokasi / Keterangan Toko */}
        <div
          className={onViewDetail ? "cursor-pointer space-y-1" : "space-y-1"}
          onClick={() => onViewDetail?.(expense)}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-xs font-semibold text-foreground transition-colors hover:text-primary">
              {expense.description}
            </p>
            {expense.quantity && (
              <Badge
                variant="outline"
                className="shrink-0 border-border/80 bg-muted/40 text-[10px] font-medium text-muted-foreground"
              >
                {expense.quantity}
              </Badge>
            )}
          </div>
          {expense.location && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <RiMapPinLine className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{expense.location}</span>
            </div>
          )}
          {expense.repairNotes && (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-2 text-[11px] text-muted-foreground">
              📝 {expense.repairNotes}
            </div>
          )}
        </div>

        {/* Rincian Finansial Pokok vs Admin Bank */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-border/70 bg-card p-2">
            <span className="text-[10px] text-muted-foreground">
              Biaya Pokok
            </span>
            <div className="font-mono font-medium text-foreground">
              {formatCurrency(amountNum)}
            </div>
          </div>
          <div className="rounded-lg border border-border/70 bg-card p-2">
            <span className="text-[10px] text-muted-foreground">
              Admin Bank
            </span>
            <div className="font-mono font-medium text-foreground">
              {adminNum > 0 ? formatCurrency(adminNum) : "-"}
            </div>
          </div>
        </div>

        {/* Total & Tombol Aksi */}
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
            {onViewDetail && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onViewDetail(expense)}
                className="h-7.5 gap-1 rounded-lg px-2 text-[11px]"
                title="Lihat Detail"
              >
                <RiEyeLine className="size-3.5" />
                <span>Detail</span>
              </Button>
            )}
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(expense)}
                className="h-7.5 gap-1 rounded-lg px-2 text-[11px]"
                title="Ubah Catatan Pengeluaran"
              >
                <RiEditLine className="size-3.5" />
                <span>Ubah</span>
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete(expense)}
                className="size-7.5 rounded-lg text-muted-foreground hover:text-destructive"
                title="Hapus Catatan Pengeluaran"
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
