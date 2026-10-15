"use client"

import * as React from "react"
import {
  RiBankCardLine,
  RiCalendarLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFileListLine,
  RiInformationLine,
  RiMapPinLine,
  RiMoneyDollarCircleLine,
  RiReceiptLine,
  RiToolsLine,
  RiTruckLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatPlateNumber, getDriverAndTruck } from "@/domain/trucks"
import { cn, formatCurrency, formatDateIndonesian } from "@/lib/utils"

import type { Expense } from "@/db/schema"

interface ExpenseDetailSheetProps {
  expense: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (expense: Expense) => void
  onDelete?: (expense: Expense) => void
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
          {category || "Lainnya"}
        </Badge>
      )
  }
}

export function ExpenseDetailSheet({
  expense,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ExpenseDetailSheetProps) {
  if (!expense) return null

  const driverInfo = getDriverAndTruck(expense.truckId)
  const amountNum = parseFloat(String(expense.amount)) || 0
  const adminNum = parseFloat(String(expense.adminFee ?? "0")) || 0
  const totalBeban = amountNum + adminNum

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
        {/* 1. Header Pinned (1:1 Standar TripDetailSheet) */}
        <div className="shrink-0 border-b border-border/80 bg-card/80 px-4 py-3.5 backdrop-blur-md sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
                <RiReceiptLine className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Detail Pengeluaran
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      expense.truckId === "W8187UA"
                        ? "py-0.2 border-primary/40 bg-primary/10 px-2 text-[10px] font-semibold text-primary"
                        : "py-0.2 border-amber-500/40 bg-amber-500/10 px-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                    }
                  >
                    <span
                      className={cn(
                        "mr-1 inline-block size-1.5 rounded-full",
                        expense.truckId === "W8187UA"
                          ? "bg-primary"
                          : "bg-amber-500"
                      )}
                    />
                    {driverInfo.driver} — {driverInfo.plate}
                  </Badge>
                  {getCategoryBadge(expense.category)}
                </div>
                <SheetTitle className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">
                  {expense.description}
                </SheetTitle>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onOpenChange(false)}
              className="size-8.5 shrink-0 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Tutup Detail Pengeluaran"
            >
              <RiCloseLine className="size-5" />
            </Button>
          </div>
          <SheetDescription className="sr-only">
            Rincian informasi transaksi beban operasional {expense.description}
          </SheetDescription>
        </div>

        {/* 2. Scrollable Body */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6">
          {/* Section 1: Ringkasan Nilai Finansial */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiMoneyDollarCircleLine className="size-3.5 text-primary" />
              <span>Rincian Finansial Transaksi</span>
            </h4>
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 shadow-xs dark:bg-rose-500/10">
              <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                Total Beban Operasional Tercatat
              </span>
              <div className="mt-1 text-2xl font-bold tracking-tight text-rose-600 tabular-nums sm:text-3xl dark:text-rose-400">
                {formatCurrency(totalBeban)}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Beban pengurang laba kotor pada periode pembagian hasil armada
              </p>

              {/* Grid Komponen Biaya */}
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-rose-500/20 pt-3">
                <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <RiMoneyDollarCircleLine className="size-3 text-muted-foreground" />
                    Biaya Pokok
                  </span>
                  <span className="mt-1 block font-mono text-sm font-semibold text-foreground tabular-nums">
                    {formatCurrency(amountNum)}
                  </span>
                </div>
                <div className="rounded-xl border border-border/70 bg-card p-3 shadow-2xs">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <RiBankCardLine className="size-3 text-muted-foreground" />
                    Admin Bank
                  </span>
                  <span className="mt-1 block font-mono text-sm font-semibold text-foreground tabular-nums">
                    {adminNum > 0 ? formatCurrency(adminNum) : "Rp0"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Informasi Transaksi & Pembelian */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiFileListLine className="size-3.5 text-primary" />
              <span>Informasi Pembelian & Nota</span>
            </h4>
            <div className="divide-y divide-border/70 rounded-2xl border border-border/80 bg-card p-4 text-xs shadow-xs">
              {/* Tanggal */}
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <span className="text-muted-foreground">
                  Tanggal Pengeluaran
                </span>
                <span className="flex items-center gap-1.5 font-semibold text-foreground">
                  <RiCalendarLine className="size-3.5 text-muted-foreground" />
                  {formatDateIndonesian(expense.expenseDate)}
                </span>
              </div>

              {/* Uraian */}
              <div className="py-2.5">
                <span className="text-muted-foreground">
                  Uraian / Nama Pengeluaran
                </span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">
                    {expense.description}
                  </p>
                  {expense.quantity && (
                    <Badge
                      variant="outline"
                      className="border-primary/30 bg-primary/10 text-[10px] font-semibold text-primary"
                    >
                      {expense.quantity}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Keterangan / Toko / Lokasi */}
              <div className="flex items-start justify-between py-2.5">
                <span className="text-muted-foreground">
                  Keterangan / Lokasi / Toko
                </span>
                <span className="text-right font-semibold text-foreground">
                  {expense.location ? (
                    <span className="flex items-center justify-end gap-1">
                      <RiMapPinLine className="size-3 text-muted-foreground" />
                      {expense.location}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60">-</span>
                  )}
                </span>
              </div>

              {/* Catatan Perbaikan / Nota Bengkel */}
              <div className="py-2.5 last:pb-0">
                <span className="text-muted-foreground">
                  Catatan Perbaikan / Rincian Nota
                </span>
                {expense.repairNotes ? (
                  <div className="mt-2 rounded-xl border border-border/80 bg-muted/30 p-3 text-xs text-foreground">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                      <RiToolsLine className="size-3 text-primary" />
                      Rincian Bengkel / Garansi:
                    </span>
                    <p className="mt-1.5 leading-relaxed">
                      {expense.repairNotes}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-muted-foreground/60">-</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Konteks Operasional Armada */}
          <div className="space-y-2">
            <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              <RiTruckLine className="size-3.5 text-primary" />
              <span>Operasional Armada</span>
            </h4>
            <div className="space-y-3 rounded-2xl border border-border/80 bg-card p-4 text-xs shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Unit Truk</span>
                <span className="font-semibold text-foreground">
                  {formatPlateNumber(expense.truckId)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  Pengemudi Bertugas
                </span>
                <span className="font-semibold text-foreground">
                  {driverInfo.driver}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Kategori Beban</span>
                <span>{getCategoryBadge(expense.category)}</span>
              </div>
            </div>
          </div>

          {/* Catatan Sistem */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-2.5">
              <RiInformationLine className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="space-y-1">
                <span className="font-semibold text-foreground">
                  Rekapitulasi Pembukuan Kas Armada
                </span>
                <p className="text-[11px] leading-relaxed">
                  Beban ini otomatis masuk ke dalam kalkulasi laporan laba rugi
                  operasional dan dividen bagi hasil armada HW Trans.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Pinned Footer Actions (1:1 Standar TripDetailSheet) */}
        <div className="shrink-0 border-t border-border/80 bg-card/80 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8.5 rounded-lg px-3 text-xs"
            >
              Tutup
            </Button>

            <div className="flex items-center gap-2">
              {onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false)
                    onDelete(expense)
                  }}
                  className="h-8.5 gap-1.5 rounded-lg border-destructive/30 px-3 text-xs text-destructive hover:bg-destructive/10"
                >
                  <RiDeleteBinLine className="size-3.5" />
                  <span>Hapus</span>
                </Button>
              )}

              {onEdit && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false)
                    onEdit(expense)
                  }}
                  className="h-8.5 gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-xs"
                >
                  <RiEditLine className="size-3.5" />
                  <span>Ubah Data</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
