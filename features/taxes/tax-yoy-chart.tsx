"use client"

import * as React from "react"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { RiLineChartLine, RiSparklingLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { TaxYoyItem } from "@/features/taxes/taxes.queries"
import { formatCurrency } from "@/lib/utils"

function formatNumber(val: number, decimals = 0): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val)
}

export interface YoyChartDataPoint {
  year: number
  yearLabel: string
  grossOmset: number
  netOmset12Pct: number
  totalExpenses: number
  realOperatingProfit: number
  bestSchemeTax: number
  bestSchemeName: string
  tax1PctWithholding: number
  totalTrips: number
  totalTonnage: number
}

export function prepareYoyChartData(items: TaxYoyItem[]): YoyChartDataPoint[] {
  if (!items || items.length === 0) return []

  return items.map((item) => ({
    year: item.year,
    yearLabel: String(item.year),
    grossOmset: item.grossOmset,
    netOmset12Pct: item.netOmset12Pct,
    totalExpenses: item.totalExpenses,
    realOperatingProfit: item.realOperatingProfit,
    bestSchemeTax: item.bestSchemeTax,
    bestSchemeName: item.bestSchemeName,
    tax1PctWithholding: item.tax1PctWithholding,
    totalTrips: item.totalTrips,
    totalTonnage: item.totalTonnage,
  }))
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color?: string
    payload: YoyChartDataPoint
  }>
  label?: string
}

function CustomYoyTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload

  return (
    <div className="min-w-64 space-y-2 rounded-xl border border-border/80 bg-popover/95 p-3 text-xs shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
        <span className="font-bold text-popover-foreground">Tahun {label}</span>
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          {data.totalTrips} Ritase ({formatNumber(data.totalTonnage, 1)} Ton)
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-blue-500" />
            Peredaran Bruto (Omset)
          </span>
          <span className="font-semibold text-foreground tabular-nums">
            {formatCurrency(data.grossOmset)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-amber-500" />
            Total Beban Riil
          </span>
          <span className="font-semibold text-amber-600 tabular-nums dark:text-amber-400">
            {formatCurrency(data.totalExpenses)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            Laba Usaha Sebelum Pajak
          </span>
          <span className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
            {formatCurrency(data.realOperatingProfit)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-1.5">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full bg-purple-500" />
            Setoran Pajak Terhemat
          </span>
          <span className="font-bold text-purple-600 tabular-nums dark:text-purple-400">
            {formatCurrency(data.bestSchemeTax)}
          </span>
        </div>

        <p className="pt-0.5 text-[10px] text-muted-foreground italic">
          Opsi Terbaik: {data.bestSchemeName}
        </p>
      </div>
    </div>
  )
}

interface TaxYoyChartProps {
  yoyData: TaxYoyItem[]
}

export function TaxYoyChart({ yoyData }: TaxYoyChartProps) {
  const chartData = React.useMemo(() => prepareYoyChartData(yoyData), [yoyData])

  const currentYear = new Date().getFullYear()

  return (
    <Card className="rounded-2xl border border-border/80 bg-card/75 shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <RiLineChartLine className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Grafik Tren Pembukuan Fiskal Antar-Tahun
              </CardTitle>
              <CardDescription className="text-xs">
                Perbandingan peredaran bruto, beban riil, laba usaha, dan
                setoran kas pajak terhemat dari tahun ke tahun
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="w-fit border-purple-500/30 bg-purple-500/5 text-xs text-purple-600 dark:text-purple-400"
          >
            Komparasi Multi-Tahun
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-2">
        {/* Chart Visualization */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                className="stroke-muted/40"
              />
              <XAxis
                dataKey="yearLabel"
                tickLine={false}
                axisLine={false}
                className="text-xs font-medium text-muted-foreground"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) =>
                  `Rp ${(value / 1000000).toFixed(0)} jt`
                }
                className="text-[11px] text-muted-foreground"
                width={80}
              />
              <Tooltip content={<CustomYoyTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    grossOmset: "Peredaran Bruto",
                    totalExpenses: "Beban Usaha Riil",
                    realOperatingProfit: "Laba Usaha Sebelum Pajak",
                    bestSchemeTax: "Setoran Pajak Terhemat",
                  }
                  return (
                    <span className="text-xs font-medium text-muted-foreground">
                      {labels[value] ?? value}
                    </span>
                  )
                }}
              />
              <Bar
                dataKey="grossOmset"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
              <Bar
                dataKey="totalExpenses"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
              <Bar
                dataKey="realOperatingProfit"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={45}
              />
              <Line
                type="monotone"
                dataKey="bestSchemeTax"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Tabel Komparasi Ringkas */}
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-left text-xs">
            <thead className="border-b bg-muted/50 font-medium text-muted-foreground">
              <tr>
                <th className="px-3.5 py-2.5">Tahun Buku</th>
                <th className="px-3.5 py-2.5 text-right">Ritase</th>
                <th className="px-3.5 py-2.5 text-right">Tonase</th>
                <th className="px-3.5 py-2.5 text-right">Omset Bruto</th>
                <th className="px-3.5 py-2.5 text-right">Beban Usaha Riil</th>
                <th className="px-3.5 py-2.5 text-right">Laba Usaha Riil</th>
                <th className="px-3.5 py-2.5 text-right">Kredit PPh 1%</th>
                <th className="px-3.5 py-2.5 text-right">
                  Setoran Kas Terhemat
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {chartData.map((row) => {
                const isCurrentYear = row.year === currentYear
                return (
                  <tr
                    key={row.year}
                    className={`transition-colors hover:bg-muted/30 ${
                      isCurrentYear ? "bg-primary/5 font-medium" : ""
                    }`}
                  >
                    <td className="px-3.5 py-2.5 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{row.year}</span>
                        {isCurrentYear && (
                          <Badge
                            variant="default"
                            className="h-4 bg-primary px-1.5 py-0 text-[10px] text-primary-foreground"
                          >
                            Tahun Berjalan
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums">
                      {row.totalTrips} rit
                    </td>
                    <td className="px-3.5 py-2.5 text-right tabular-nums">
                      {formatNumber(row.totalTonnage, 1)} ton
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-medium text-foreground tabular-nums">
                      {formatCurrency(row.grossOmset)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-amber-600 tabular-nums dark:text-amber-400">
                      {formatCurrency(row.totalExpenses)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                      {formatCurrency(row.realOperatingProfit)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right text-muted-foreground tabular-nums">
                      {formatCurrency(row.tax1PctWithholding)}
                    </td>
                    <td className="px-3.5 py-2.5 text-right font-bold text-purple-600 tabular-nums dark:text-purple-400">
                      <div className="flex items-center justify-end gap-1">
                        <RiSparklingLine className="size-3 text-purple-500" />
                        <span>{formatCurrency(row.bestSchemeTax)}</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
