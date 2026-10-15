import * as React from "react"
import {
  RiCoinsLine,
  RiHandCoinLine,
  RiPercentLine,
  RiReceiptLine,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import type { TaxAccountingData } from "@/features/taxes/taxes.queries"
import { formatCurrency } from "@/lib/utils"

interface TaxSummaryProps {
  data: TaxAccountingData
}

export function TaxSummary({ data }: TaxSummaryProps) {
  const { bookkeeping, recommendation, schemes } = data.calculations
  const bestScheme = schemes.find((s) => s.isRecommended) ?? schemes[0]

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      {/* Card 1: Peredaran Bruto (Omset) */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/25 dark:text-blue-400">
              <RiCoinsLine className="size-4.5" />
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400"
            >
              Omset Kotor
            </Badge>
          </div>

          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Peredaran Bruto Ritase
          </p>

          <div className="mt-1">
            <span className="text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl xl:text-xl 2xl:text-2xl">
              {formatCurrency(bookkeeping.grossOmset)}
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-0.5 border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <span className="truncate">Akumulasi seluruh surat jalan</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Sebelum koreksi penurunan omset 12.5%
          </p>
        </div>
      </div>

      {/* Card 2: Omset Bersih Usaha */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-primary/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
              <RiPercentLine className="size-4.5" />
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
            >
              Neto 87.5%
            </Badge>
          </div>

          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Omset Usaha Bersih
          </p>

          <div className="mt-1">
            <span className="text-xl font-bold tracking-tight text-foreground tabular-nums sm:text-2xl xl:text-xl 2xl:text-2xl">
              {formatCurrency(bookkeeping.netOmset)}
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-0.5 border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <span className="truncate">Dasar evaluasi laba riil</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Koreksi omset: -{formatCurrency(bookkeeping.revenueReduction)}
          </p>
        </div>
      </div>

      {/* Card 3: Total Beban Usaha Riil */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-destructive/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/25 dark:text-rose-400">
              <RiReceiptLine className="size-4.5" />
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400"
            >
              Total Beban
            </Badge>
          </div>

          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Total Beban Usaha Riil
          </p>

          <div className="mt-1">
            <span className="text-xl font-bold tracking-tight text-rose-600 tabular-nums sm:text-2xl xl:text-xl 2xl:text-2xl dark:text-rose-400">
              {formatCurrency(bookkeeping.totalRealExpenses)}
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-0.5 border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <span className="truncate">Sangu, DO, pabrik & operasional</span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Biaya ritase {formatCurrency(bookkeeping.directTripExpenses)} + Ops{" "}
            {formatCurrency(bookkeeping.truckOpex)}
          </p>
        </div>
      </div>

      {/* Card 4: Laba Usaha Riil Sebelum Pajak */}
      <div className="group flex h-full flex-col justify-between rounded-2xl border border-border/80 bg-card/75 p-4 shadow-xs backdrop-blur-xs transition-all duration-200 hover:border-emerald-500/30 hover:shadow-md sm:p-5">
        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-400">
              <RiHandCoinLine className="size-4.5" />
            </div>
            <Badge
              variant="outline"
              className="shrink-0 gap-0.5 rounded-full border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
            >
              Laba Bersih Usaha
            </Badge>
          </div>

          <p className="mt-3 text-xs font-semibold text-muted-foreground">
            Laba Usaha Sebelum Pajak
          </p>

          <div className="mt-1">
            <span
              className={`text-xl font-bold tracking-tight tabular-nums sm:text-2xl xl:text-xl 2xl:text-2xl ${
                bookkeeping.realOperatingProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatCurrency(bookkeeping.realOperatingProfit)}
            </span>
          </div>
        </div>

        <div className="mt-3.5 flex flex-col gap-0.5 border-t border-border/50 pt-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <span className="truncate">
              Setoran Terhemat: {formatCurrency(bestScheme?.netTaxPayable ?? 0)}
            </span>
          </div>
          <p className="truncate text-[11px] text-muted-foreground">
            Pilihan: {recommendation.bestSchemeName}
          </p>
        </div>
      </div>
    </div>
  )
}
