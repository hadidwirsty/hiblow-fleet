"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import type { ChartDataPoint } from "@/features/dashboard/dashboard.queries"

export interface DashboardTripChartProps {
  data: ChartDataPoint[]
}

export type ChartAreaInteractiveProps = DashboardTripChartProps

const chartConfig = {
  trips: {
    label: "Total Ritase",
  },
  w8187ua: {
    label: "W 8187 UA (Triyono)",
    color: "var(--primary)",
  },
  h8133of: {
    label: "H 8133 OF (Khoirul)",
    color: "#f59e0b",
  },
} satisfies ChartConfig

export function DashboardTripChart({ data = [] }: DashboardTripChartProps) {
  const isMobile = useIsMobile()
  const [selectedRange, setSelectedRange] = React.useState<string | null>(null)
  const timeRange = selectedRange ?? (isMobile ? "7d" : "30d")

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return []
    if (timeRange === "7d") return data.slice(-7)
    if (timeRange === "14d") return data.slice(-14)
    return data
  }, [data, timeRange])

  const maxVal = React.useMemo(() => {
    if (filteredData.length === 0) return 4
    const highest = Math.max(
      ...filteredData.map((d) => (d.w8187ua ?? 0) + (d.h8133of ?? 0))
    )
    return Math.max(4, highest + 1)
  }, [filteredData])

  return (
    <Card className="border-border bg-card/60 shadow-xs backdrop-blur-xs">
      <CardHeader className="flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <CardTitle className="text-base font-semibold">
              Aktivitas Ritase Harian Armada
            </CardTitle>
            <div className="flex items-center gap-2.5 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="size-2 rounded-full bg-primary" />W 8187 UA
                (Triyono)
              </span>
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="size-2 rounded-full bg-amber-500" />H 8133 OF
                (Khoirul)
              </span>
            </div>
          </div>
          <CardDescription className="text-xs">
            Perbandingan volume ritase jalan semen curah per hari antar unit
            armada
          </CardDescription>
        </div>

        {/* Segmented Tabs Control ala Total Visitors */}
        <div
          role="tablist"
          aria-label="Filter Rentang Waktu"
          className="inline-flex w-fit items-center rounded-lg border border-border/80 bg-muted/60 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={timeRange === "30d"}
            onClick={() => setSelectedRange("30d")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              timeRange === "30d"
                ? "bg-background font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="hidden sm:inline">30 Hari Terakhir</span>
            <span className="sm:hidden">30 Hari</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={timeRange === "14d"}
            onClick={() => setSelectedRange("14d")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              timeRange === "14d"
                ? "bg-background font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="hidden sm:inline">14 Hari Terakhir</span>
            <span className="sm:hidden">14 Hari</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={timeRange === "7d"}
            onClick={() => setSelectedRange("7d")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
              timeRange === "7d"
                ? "bg-background font-semibold text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="hidden sm:inline">7 Hari Terakhir</span>
            <span className="sm:hidden">7 Hari</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="px-1 pt-2 sm:px-6 sm:pt-4">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-60 w-full sm:h-75 lg:h-87.5"
        >
          <AreaChart
            data={filteredData}
            margin={{ left: -15, right: 10, top: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillW8187" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-w8187ua)"
                  stopOpacity={0.7}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-w8187ua)"
                  stopOpacity={0.05}
                />
              </linearGradient>
              <linearGradient id="fillH8133" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-h8133of)"
                  stopOpacity={0.7}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-h8133of)"
                  stopOpacity={0.05}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              className="stroke-muted/50"
            />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                })
              }}
              className="text-xs text-muted-foreground"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              allowDecimals={false}
              domain={[0, maxVal]}
              tickFormatter={(val) => `${val} rit`}
              className="text-xs text-muted-foreground"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="w8187ua"
              type="natural"
              fill="url(#fillW8187)"
              stroke="var(--color-w8187ua)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="h8133of"
              type="natural"
              fill="url(#fillH8133)"
              stroke="var(--color-h8133of)"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export { DashboardTripChart as ChartAreaInteractive }
