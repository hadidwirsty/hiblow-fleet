"use client"

import * as React from "react"
import {
  RiCalendarLine,
  RiDownloadLine,
  RiFileExcelLine,
  RiFileLine,
  RiLockLine,
  RiLockUnlockLine,
  RiPrinterLine,
} from "@remixicon/react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  formatProfitSharingForCsv,
  formatProfitSharingForExcel,
  getProfitSharingExportFilename,
} from "@/features/profit-sharing/profit-sharing.export"
import { buildCsvString } from "@/lib/export/csv-builder"
import { triggerBlobDownload, triggerTextDownload } from "@/lib/export/download"
import { buildExcelWorkbookBlob } from "@/lib/export/excel-builder"
import { formatCurrency, formatDateIndonesian } from "@/lib/utils"

import { updateProfitSharingStatus } from "./profit-sharing.actions"
import type { ProfitSharingPeriodDetail } from "./profit-sharing.queries"

interface PeriodDetailSheetProps {
  period: ProfitSharingPeriodDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PeriodDetailSheet({
  period,
  open,
  onOpenChange,
}: PeriodDetailSheetProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false)

  if (!period) return null

  const isFinalized = period.status === "finalized"
  const totalIncome = parseFloat(period.totalIncome)
  const totalExpenses = parseFloat(period.totalExpenses)
  const grossBalance = parseFloat(period.grossBalance)
  const commissionAmount = parseFloat(period.managerCommissionAmount)
  const distributableProfit = parseFloat(period.distributableProfit)
  const managerProfit = parseFloat(period.managerProfit)
  const managerTakeHome = parseFloat(period.managerTakeHome)
  const fleetValuation = parseFloat(period.fleetValuation)

  const handleToggleStatus = async () => {
    setIsUpdatingStatus(true)
    const nextStatus = isFinalized ? "draft" : "finalized"
    try {
      const res = await updateProfitSharingStatus(period.id, nextStatus)
      if (res.success) {
        toast.success(
          nextStatus === "finalized"
            ? "Periode berhasil dikunci (Finalized)"
            : "Periode diubah menjadi Draft"
        )
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error("Gagal mengubah status periode")
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    try {
      const sheets = formatProfitSharingForExcel(period)
      const blob = buildExcelWorkbookBlob({ sheets })
      const filename = getProfitSharingExportFilename(period, "xlsx")
      triggerBlobDownload(blob, filename)
      toast.success(`Laporan bagi hasil berhasil diunduh (${filename})`)
    } catch {
      toast.error("Gagal mengekspor laporan bagi hasil ke Excel")
    }
  }

  const handleExportCsv = () => {
    try {
      const sheetData = formatProfitSharingForCsv(period)
      const csv = buildCsvString({
        headers: sheetData.headers,
        rows: sheetData.rows,
      })
      const filename = getProfitSharingExportFilename(period, "csv")
      triggerTextDownload(csv, filename)
      toast.success(`Laporan bagi hasil berhasil diunduh (${filename})`)
    } catch {
      toast.error("Gagal mengekspor laporan bagi hasil ke CSV")
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto p-0 sm:max-w-2xl print:max-w-full print:overflow-visible print:p-0"
      >
        {/* Sheet Top Header */}
        <div className="border-b bg-muted/40 p-6 print:border-b-2 print:p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-xl font-bold tracking-tight">
                  {period.title}
                </SheetTitle>
                <Badge
                  variant={isFinalized ? "default" : "outline"}
                  className={`text-xs ${
                    isFinalized
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "text-muted-foreground"
                  }`}
                >
                  {isFinalized ? (
                    <span className="flex items-center gap-1">
                      <RiLockLine className="size-3" />
                      Finalized
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <RiLockUnlockLine className="size-3" />
                      Draft
                    </span>
                  )}
                </Badge>
              </div>
              <SheetDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RiCalendarLine className="size-3.5" />
                Periode Bongkar: {formatDateIndonesian(
                  period.startDate,
                  true
                )}{" "}
                – {formatDateIndonesian(period.endDate, true)}
              </SheetDescription>
            </div>

            {/* Print & Export Controls (Hidden on Print) */}
            <div className="flex items-center gap-2 print:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs shadow-xs"
                    >
                      <RiDownloadLine className="size-3.5 text-muted-foreground" />
                      <span>Export</span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={handleExportExcel}
                    className="flex cursor-pointer items-center gap-2 text-xs"
                  >
                    <RiFileExcelLine className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Download Excel (.xlsx)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleExportCsv}
                    className="flex cursor-pointer items-center gap-2 text-xs"
                  >
                    <RiFileLine className="size-4 text-sky-600 dark:text-sky-400" />
                    <span>Download CSV (.csv)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-xs"
                onClick={handlePrint}
              >
                <RiPrinterLine className="size-3.5" />
                Cetak Lembar
              </Button>
            </div>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="space-y-6 p-6 print:space-y-4 print:p-6">
          {/* Printable Header Letterhead */}
          <div className="mb-4 hidden border-b pb-4 text-center print:block">
            <h2 className="text-lg font-bold tracking-wider uppercase">
              HW TRANS — SEMEN CURAH HI-BLOW
            </h2>
            <p className="text-xs text-muted-foreground">
              Laporan Rekapitulasi Pembagian Hasil Periode Tutup Buku
            </p>
            <p className="mt-1 text-xs font-semibold">
              {period.title} ({formatDateIndonesian(period.startDate)} s/d{" "}
              {formatDateIndonesian(period.endDate)})
            </p>
          </div>

          {/* Section 1: Financial Summary KPI */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              1. Rekapitulasi Operasional & Laba Armada
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-card p-3">
                <span className="block text-[11px] text-muted-foreground">
                  Total Omset Ritase
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <span className="block text-[11px] text-muted-foreground">
                  Beban Operasional Riil
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <span className="block text-[11px] text-muted-foreground">
                  Laba Kotor (Gross)
                </span>
                <span
                  className={`text-sm font-bold ${
                    grossBalance >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {formatCurrency(grossBalance)}
                </span>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <span className="block text-[11px] text-muted-foreground">
                  Komisi Pengelola (
                  {(parseFloat(period.managerCommissionRate) * 100).toFixed(1)}
                  %)
                </span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(commissionAmount)}
                </span>
              </div>
              <div className="rounded-lg border bg-card p-3 sm:col-span-2">
                <span className="block text-[11px] text-muted-foreground">
                  Laba Bersih Siap Dibagi (Distributable Profit)
                </span>
                <span className="text-base font-extrabold text-primary">
                  {formatCurrency(distributableProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Partner Distribution Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                2. Rincian Dividen Pemodal / Investor
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Valuasi Armada: {formatCurrency(fleetValuation)}
              </span>
            </div>

            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-xs">
                <thead className="border-b bg-muted/60">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-medium">No</th>
                    <th className="px-3 py-2.5 text-left font-medium">
                      Nama Pemodal
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium">
                      Modal Disetor
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium">
                      Porsi Saham
                    </th>
                    <th className="px-3 py-2.5 text-right font-medium">
                      Hak Bagi Hasil (Rp)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {period.shares.map((share, idx) => {
                    const capital = parseFloat(share.capitalShare)
                    const percentage = parseFloat(share.sharePercentage) * 100
                    const payout = parseFloat(share.payoutAmount)
                    return (
                      <tr key={share.id} className="hover:bg-muted/20">
                        <td className="px-3 py-2 text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 font-semibold text-foreground">
                          {share.partnerName}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {formatCurrency(capital)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                          {percentage.toFixed(4)}%
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(payout)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t bg-muted/40 font-semibold">
                  <tr>
                    <td colSpan={2} className="px-3 py-2.5">
                      Total Pembagian Investor
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {formatCurrency(
                        period.shares.reduce(
                          (sum, s) => sum + parseFloat(s.capitalShare),
                          0
                        )
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {(
                        period.shares.reduce(
                          (sum, s) => sum + parseFloat(s.sharePercentage),
                          0
                        ) * 100
                      ).toFixed(2)}
                      %
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(
                        period.shares.reduce(
                          (sum, s) => sum + parseFloat(s.payoutAmount),
                          0
                        )
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 3: Manager Profit Summary */}
          <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h3 className="text-xs font-semibold tracking-wider text-primary uppercase">
              3. Hak Pengelola (Mas Hafidz)
            </h3>
            <div className="grid grid-cols-1 gap-3 pt-1 text-xs sm:grid-cols-3">
              <div className="rounded-lg border bg-background/80 p-2.5">
                <span className="block text-[11px] text-muted-foreground">
                  Komisi Operasional Pengelola:
                </span>
                <span className="font-bold text-foreground">
                  {formatCurrency(commissionAmount)}
                </span>
              </div>
              <div className="rounded-lg border bg-background/80 p-2.5">
                <span className="block text-[11px] text-muted-foreground">
                  Laba Saham Armada Pengelola:
                </span>
                <span className="font-bold text-foreground">
                  {formatCurrency(managerProfit)}
                </span>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5">
                <span className="block text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  Total Take Home Pengelola:
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(managerTakeHome)}
                </span>
              </div>
            </div>
          </div>

          {/* Printable Signature Lines */}
          <div className="hidden grid-cols-2 gap-12 pt-8 text-center text-xs print:grid">
            <div>
              <p className="font-semibold">Disetujui Pengelola,</p>
              <div className="h-16"></div>
              <p className="border-t border-dashed pt-1 font-bold">
                ( Mas Hafidz )
              </p>
            </div>
            <div>
              <p className="font-semibold">Perwakilan Investor,</p>
              <div className="h-16"></div>
              <p className="border-t border-dashed pt-1 font-bold">
                ( ..................................... )
              </p>
            </div>
          </div>

          {/* Footer Controls (Hidden on Print) */}
          <div className="flex items-center justify-between border-t pt-4 print:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
            >
              {isFinalized ? (
                <>
                  <RiLockUnlockLine className="size-3.5" />
                  Buka Kunci (Kembalikan ke Draft)
                </>
              ) : (
                <>
                  <RiLockLine className="size-3.5" />
                  Kunci Periode (Finalize)
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Tutup
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
