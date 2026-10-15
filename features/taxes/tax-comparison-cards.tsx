import * as React from "react"
import { RiSparklingFill } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  TaxAccountingResult,
  TaxSchemeCalculation,
} from "@/domain/calculators/tax-accounting"
import { formatCurrency } from "@/lib/utils"

export function formatSchemeBadge(scheme: TaxSchemeCalculation): string {
  return scheme.isRecommended ? "Paling Hemat Kas" : "Opsi Alternatif"
}

export function getSchemeCardColor(isRecommended: boolean): string {
  return isRecommended
    ? "border-emerald-500 bg-emerald-50/40 dark:border-emerald-500/60 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/20"
    : "border-border/80 bg-card/75 hover:bg-card hover:border-primary/30 transition-colors shadow-xs"
}

interface TaxComparisonCardsProps {
  calculations: TaxAccountingResult
}

export function TaxComparisonCards({ calculations }: TaxComparisonCardsProps) {
  const { schemes, recommendation } = calculations

  return (
    <div className="space-y-4">
      {/* Smart Recommendation Banner */}
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/80 p-4 text-emerald-950 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-100">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-500 p-2 text-white shadow-sm">
            <RiSparklingFill className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                Rekomendasi Skema Paling Hemat Kas
              </span>
              <Badge
                variant="outline"
                className="border-emerald-500/50 bg-emerald-100 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
              >
                Pilihan Terbaik
              </Badge>
            </div>
            <p className="mt-1 text-sm leading-relaxed font-medium">
              {recommendation.explanation}
            </p>
          </div>
        </div>
        {recommendation.cashSavings > 0 && (
          <div className="shrink-0 rounded-xl bg-emerald-600/10 px-3.5 py-2 text-left sm:text-right dark:bg-emerald-400/10">
            <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Potensi Penghematan Kas
            </div>
            <div className="text-lg font-bold text-emerald-700 tabular-nums dark:text-emerald-300">
              {formatCurrency(recommendation.cashSavings)}
            </div>
          </div>
        )}
      </div>

      {/* 3 Scheme Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {schemes.map((scheme) => {
          const isWinner = scheme.isRecommended

          return (
            <Card
              key={scheme.schemeId}
              className={`flex flex-col justify-between overflow-hidden rounded-2xl transition-all ${getSchemeCardColor(
                isWinner
              )}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant={isWinner ? "default" : "secondary"}
                      className={
                        isWinner
                          ? "bg-emerald-600 text-white hover:bg-emerald-700"
                          : ""
                      }
                    >
                      {scheme.rateDisplay}
                    </Badge>
                    {isWinner && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/40 bg-emerald-500/10 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300"
                      >
                        Paling Hemat Kas
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {scheme.schemeId === "umkm_0_5"
                      ? "Skema A"
                      : scheme.schemeId === "norma_29_11"
                        ? "Skema B"
                        : "Skema C"}
                  </span>
                </div>
                <CardTitle className="mt-2.5 text-base leading-snug font-bold">
                  {scheme.schemeName}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                  {scheme.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0 text-sm">
                <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-background/50 p-3">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs text-muted-foreground">
                      Dasar Pengenaan Pajak (DPP)
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatCurrency(scheme.dpp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">
                      Pajak Terutang (Bruto)
                    </span>
                    <span className="font-medium text-foreground tabular-nums">
                      {formatCurrency(scheme.grossTax)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-xs text-muted-foreground">
                      Kredit PPh 1% Terpotong
                    </span>
                    <span
                      className={`font-medium tabular-nums ${
                        scheme.taxCredit > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {scheme.taxCredit > 0
                        ? `- ${formatCurrency(scheme.taxCredit)}`
                        : "Tidak Berlaku"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-semibold text-foreground">
                      Sisa Setoran Kas Riil
                    </span>
                    <span
                      className={`text-base font-bold tabular-nums ${
                        isWinner
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      }`}
                    >
                      {scheme.taxOverpayment > 0 ? (
                        <span className="text-blue-600 dark:text-blue-400">
                          Lebih Bayar: {formatCurrency(scheme.taxOverpayment)}
                        </span>
                      ) : (
                        formatCurrency(scheme.netTaxPayable)
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2 text-xs">
                  <span className="text-muted-foreground">
                    Laba Bersih Setelah Pajak
                  </span>
                  <span
                    className={`font-semibold tabular-nums ${
                      scheme.realNetProfitAfterTax >= 0
                        ? "text-foreground"
                        : "text-destructive"
                    }`}
                  >
                    {formatCurrency(scheme.realNetProfitAfterTax)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
