import * as React from "react"
import Link from "next/link"
import {
  RiArrowRightLine,
  RiPercentLine,
  RiSparklingFill,
} from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { TaxAccountingResult } from "@/domain/calculators/tax-accounting"
import { formatCurrency } from "@/lib/utils"

export interface DashboardTaxWidgetData {
  yearLabel: string
  grossOmsetFormatted: string
  bestSchemeName: string
  estimatedCashTaxFormatted: string
  cashSavingsFormatted: string
  href: string
}

export function formatDashboardTaxWidgetData(
  calculations: TaxAccountingResult,
  year: number
): DashboardTaxWidgetData {
  const { bookkeeping, schemes, recommendation } = calculations
  const bestScheme = schemes.find((s) => s.isRecommended) || schemes[0]

  return {
    yearLabel: `Tahun ${year}`,
    grossOmsetFormatted: formatCurrency(bookkeeping.grossOmset),
    bestSchemeName: bestScheme.schemeName,
    estimatedCashTaxFormatted: formatCurrency(bestScheme.netTaxPayable),
    cashSavingsFormatted: formatCurrency(recommendation.cashSavings),
    href: `/taxes?year=${year}`,
  }
}

interface DashboardTaxWidgetProps {
  calculations: TaxAccountingResult
  year: number
}

export function DashboardTaxWidget({
  calculations,
  year,
}: DashboardTaxWidgetProps) {
  const data = formatDashboardTaxWidgetData(calculations, year)

  return (
    <Card className="border-emerald-500/30 bg-linear-to-r from-emerald-50/60 via-background to-emerald-50/30 shadow-xs dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="shrink-0 rounded-xl bg-emerald-600/10 p-2.5 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
            <RiPercentLine className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Estimasi Posisi Pajak Usaha
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-100/60 px-2 py-0 text-[10.5px] text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              >
                {data.yearLabel}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-lg font-bold text-foreground">
                Setoran Kas: {data.estimatedCashTaxFormatted}
              </span>
              <span className="text-xs text-muted-foreground">
                (dari Omset Bruto: {data.grossOmsetFormatted})
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <RiSparklingFill className="inline size-3 text-emerald-600 dark:text-emerald-400" />
              <span>
                Paling Hemat:{" "}
                <strong className="font-semibold text-foreground">
                  {data.bestSchemeName}
                </strong>
                {calculations.recommendation.cashSavings > 0 && (
                  <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                    (Potensi Hemat {data.cashSavingsFormatted})
                  </span>
                )}
              </span>
            </p>
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-center">
          <Link
            href={data.href}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className:
                "h-9 gap-1.5 border-emerald-500/40 bg-background text-xs font-medium text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/50",
            })}
          >
            <span>Buka Pembukuan Fiskal</span>
            <RiArrowRightLine className="size-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
