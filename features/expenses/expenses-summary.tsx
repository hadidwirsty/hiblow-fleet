import {
  RiBankCardLine,
  RiFileListLine,
  RiMoneyDollarCircleLine,
  RiToolsLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

import type { ExpensesSummary as ExpensesSummaryType } from "./expenses.queries"

interface ExpensesSummaryProps {
  summary: ExpensesSummaryType
}

export function ExpensesSummary({ summary }: ExpensesSummaryProps) {
  const adminFeePercentage =
    summary.totalExpenses > 0
      ? ((summary.totalAdminFee / summary.totalExpenses) * 100).toFixed(1)
      : "0.0"

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      {/* 1. Total Catatan Pengeluaran */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
              <RiFileListLine className="size-4.5" />
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
            >
              Nota Beban
            </Badge>
          </div>

          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Total Catatan Pengeluaran
          </p>

          <div className="mt-1">
            <span className="text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl xl:text-xl 2xl:text-2xl">
              {summary.totalCount.toLocaleString("id-ID")}{" "}
              <span className="text-sm font-semibold text-muted-foreground">
                Transaksi
              </span>
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-0.5 border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <span className="truncate">Transaksi beban tercatat</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Unit armada W 8187 UA & H 8133 OF
          </p>
        </div>
      </div>

      {/* 2. Total Beban Operasional */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-rose-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/25 dark:text-rose-400">
              <RiMoneyDollarCircleLine className="size-4.5" />
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
            >
              Total Beban
            </Badge>
          </div>

          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Total Beban Operasional
          </p>

          <div className="mt-1">
            <span className="text-xl font-bold tracking-tight text-rose-600 tabular-nums sm:text-2xl xl:text-xl 2xl:text-2xl dark:text-rose-400">
              {formatCurrency(summary.totalExpenses)}
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-0.5 border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <span className="truncate">Akumulasi nominal + admin bank</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Komponen pengurang laba bagi hasil
          </p>
        </div>
      </div>

      {/* 3. Biaya Pokok Servis & Part */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-amber-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/25 dark:text-amber-400">
              <RiToolsLine className="size-4.5" />
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
            >
              Servis & Part
            </Badge>
          </div>

          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Biaya Pokok Servis & Part
          </p>

          <div className="mt-1">
            <span className="text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl xl:text-xl 2xl:text-2xl">
              {formatCurrency(summary.totalAmount)}
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-0.5 border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="truncate">Beban belanja sebelum admin</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Onderdil, servis bengkel, BBM & lain-lain
          </p>
        </div>
      </div>

      {/* 4. Total Biaya Admin Bank */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-blue-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/25 dark:text-blue-400">
              <RiBankCardLine className="size-4.5" />
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400"
            >
              {adminFeePercentage}% Rasio
            </Badge>
          </div>

          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Biaya Admin Transfer
          </p>

          <div className="mt-1">
            <span className="text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl xl:text-xl 2xl:text-2xl">
              {formatCurrency(summary.totalAdminFee)}
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-0.5 border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400">
            <span className="truncate">Akumulasi admin perbankan</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Dicatat per transaksi transfer m-banking
          </p>
        </div>
      </div>
    </div>
  )
}
