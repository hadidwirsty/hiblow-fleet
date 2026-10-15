import * as React from "react"
import { RiFileTextLine } from "@remixicon/react"

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

export interface BookkeepingSectionData {
  revenue: {
    grossOmset: number
    reductionRateDisplay: string
    revenueReduction: number
    netOmset: number
  }
  directExpenses: {
    driverSangu: number
    driverIncentive: number
    thirdPartyFee: number
    factoryDeductions: number
    total: number
  }
  opex: {
    categories: { category: string; total: number; count: number }[]
    total: number
  }
  operatingProfit: number
  schemes: TaxSchemeCalculation[]
}

export function formatBookkeepingRowData(
  calculations: TaxAccountingResult,
  categoryBreakdown: { category: string; total: number; count: number }[]
): BookkeepingSectionData {
  const { bookkeeping, schemes } = calculations

  return {
    revenue: {
      grossOmset: bookkeeping.grossOmset,
      reductionRateDisplay: `${bookkeeping.revenueReductionRate * 100}%`,
      revenueReduction: bookkeeping.revenueReduction,
      netOmset: bookkeeping.netOmset,
    },
    directExpenses: {
      driverSangu: bookkeeping.driverSangu,
      driverIncentive: bookkeeping.driverIncentive,
      thirdPartyFee: bookkeeping.thirdPartyFee,
      factoryDeductions: bookkeeping.factoryDeductions,
      total: bookkeeping.directTripExpenses,
    },
    opex: {
      categories: categoryBreakdown,
      total: bookkeeping.truckOpex,
    },
    operatingProfit: bookkeeping.realOperatingProfit,
    schemes,
  }
}

interface TaxAccountingTableProps {
  calculations: TaxAccountingResult
  categoryBreakdown: { category: string; total: number; count: number }[]
  periodLabel: string
}

export function TaxAccountingTable({
  calculations,
  categoryBreakdown,
  periodLabel,
}: TaxAccountingTableProps) {
  const data = formatBookkeepingRowData(calculations, categoryBreakdown)

  return (
    <Card className="rounded-2xl border border-border/80 bg-card/75 shadow-xs print:border-none print:bg-white print:shadow-none">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <RiFileTextLine className="size-4" />
              </div>
              <CardTitle className="text-base font-bold sm:text-lg">
                Laporan Pembukuan Fiskal Usaha Transportasi
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Rekapitulasi operasional riil dan evaluasi laba fiskal periode:{" "}
              <span className="font-semibold text-foreground">
                {periodLabel}
              </span>
            </CardDescription>
          </div>
          <Badge variant="outline" className="w-fit text-xs font-medium">
            PT Hadya Wiran Trans
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            {/* Bagian I: Pendapatan Usaha */}
            <thead className="bg-muted/50 text-xs font-semibold tracking-wider text-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5">
                  I. Pendapatan Usaha Transportasi
                </th>
                <th className="w-44 px-4 py-2.5 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr className="hover:bg-muted/30">
                <td className="px-4 py-2 pl-6 text-muted-foreground">
                  Peredaran Bruto / Total Omset Ritase Truk
                </td>
                <td className="px-4 py-2 text-right font-medium text-foreground tabular-nums">
                  {formatCurrency(data.revenue.grossOmset)}
                </td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="px-4 py-2 pl-6 text-muted-foreground">
                  Koreksi Penurunan Omset ({data.revenue.reductionRateDisplay})
                </td>
                <td className="px-4 py-2 text-right font-medium text-rose-600 tabular-nums dark:text-rose-400">
                  - {formatCurrency(data.revenue.revenueReduction)}
                </td>
              </tr>
              <tr className="bg-muted/20 font-semibold">
                <td className="px-4 py-2 text-foreground">
                  Omset Usaha Bersih (Neto)
                </td>
                <td className="px-4 py-2 text-right text-foreground tabular-nums">
                  {formatCurrency(data.revenue.netOmset)}
                </td>
              </tr>
            </tbody>

            {/* Bagian II: Beban Langsung Ritase */}
            <thead className="bg-muted/50 text-xs font-semibold tracking-wider text-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5">
                  II. Beban Langsung Ritase (Biaya Pokok Operasional)
                </th>
                <th className="w-44 px-4 py-2.5 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              <tr className="hover:bg-muted/30">
                <td className="px-4 py-2 pl-6 text-muted-foreground">
                  Sangu Supir All-In (BBM Solar, Tol, & Uang Jalan)
                </td>
                <td className="px-4 py-2 text-right text-foreground tabular-nums">
                  {formatCurrency(data.directExpenses.driverSangu)}
                </td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="px-4 py-2 pl-6 text-muted-foreground">
                  Insentif Ritase Supir
                </td>
                <td className="px-4 py-2 text-right text-foreground tabular-nums">
                  {formatCurrency(data.directExpenses.driverIncentive)}
                </td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="px-4 py-2 pl-6 text-muted-foreground">
                  Biaya Surat Pengantar DO Pihak Ketiga (Mas Wawan)
                </td>
                <td className="px-4 py-2 text-right text-foreground tabular-nums">
                  {formatCurrency(data.directExpenses.thirdPartyFee)}
                </td>
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="px-4 py-2 pl-6 text-muted-foreground">
                  Potongan Operasional Pabrik Semen (LJU 2% & PPh 1%)
                </td>
                <td className="px-4 py-2 text-right text-foreground tabular-nums">
                  {formatCurrency(data.directExpenses.factoryDeductions)}
                </td>
              </tr>
              <tr className="bg-muted/20 font-semibold">
                <td className="px-4 py-2 text-foreground">
                  Total Beban Langsung Ritase
                </td>
                <td className="px-4 py-2 text-right text-foreground tabular-nums">
                  {formatCurrency(data.directExpenses.total)}
                </td>
              </tr>
            </tbody>

            {/* Bagian III: Beban Operasional Armada */}
            <thead className="bg-muted/50 text-xs font-semibold tracking-wider text-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5">
                  III. Beban Operasional Truk (Biaya Operasional Non-DP/Cicilan)
                </th>
                <th className="w-44 px-4 py-2.5 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.opex.categories.length > 0 ? (
                data.opex.categories.map((cat) => (
                  <tr key={cat.category} className="hover:bg-muted/30">
                    <td className="px-4 py-2 pl-6 text-muted-foreground">
                      {cat.category} ({cat.count} transaksi)
                    </td>
                    <td className="px-4 py-2 text-right text-foreground tabular-nums">
                      {formatCurrency(cat.total)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-2 pl-6 text-xs text-muted-foreground italic"
                  >
                    Tidak ada biaya operasional tercatat pada periode ini.
                  </td>
                </tr>
              )}
              <tr className="bg-muted/20 font-semibold">
                <td className="px-4 py-2 text-foreground">
                  Total Beban Operasional Truk
                </td>
                <td className="px-4 py-2 text-right text-foreground tabular-nums">
                  {formatCurrency(data.opex.total)}
                </td>
              </tr>
            </tbody>

            {/* Bagian IV: Laba Usaha Riil */}
            <thead className="bg-muted/50 text-xs font-semibold tracking-wider text-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5">
                  IV. Laba Usaha Riil Sebelum Pajak
                </th>
                <th className="w-44 px-4 py-2.5 text-right">Nominal (Rp)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-muted/30 text-base font-bold">
                <td className="px-4 py-3 text-foreground">
                  Laba Bersih Usaha Operasional Transportasi
                </td>
                <td
                  className={`px-4 py-3 text-right tabular-nums ${
                    data.operatingProfit >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {formatCurrency(data.operatingProfit)}
                </td>
              </tr>
            </tbody>

            {/* Bagian V: Komparasi Pajak & Laba Setelah Pajak */}
            <thead className="bg-muted/50 text-xs font-semibold tracking-wider text-foreground uppercase">
              <tr>
                <th className="px-4 py-2.5">
                  V. Evaluasi Beban Pajak & Laba Bersih Setelah Pajak
                </th>
                <th className="w-44 px-4 py-2.5 text-right">
                  Setoran Pajak / Laba Akhir
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {data.schemes.map((scheme) => (
                <tr
                  key={scheme.schemeId}
                  className={`hover:bg-muted/30 ${
                    scheme.isRecommended
                      ? "bg-emerald-500/10 font-semibold"
                      : ""
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">
                        {scheme.schemeName} ({scheme.rateDisplay})
                      </span>
                      {scheme.isRecommended && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500 px-1.5 py-0 text-[10px] text-emerald-700 dark:text-emerald-400"
                        >
                          Paling Hemat Kas
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      DPP: {formatCurrency(scheme.dpp)} | Laba Bersih Akhir:{" "}
                      {formatCurrency(scheme.realNetProfitAfterTax)}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-bold text-foreground tabular-nums">
                    {scheme.taxOverpayment > 0 ? (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        Lebih Bayar: {formatCurrency(scheme.taxOverpayment)}
                      </span>
                    ) : (
                      formatCurrency(scheme.netTaxPayable)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
