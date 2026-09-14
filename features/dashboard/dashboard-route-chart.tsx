"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { ChartRouteItem } from "@/domain/route-trend"
import { formatCurrency } from "@/lib/utils"

interface DashboardRouteChartProps {
  data: ChartRouteItem[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartRouteItem }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="min-w-48 space-y-1 rounded-lg border bg-card px-3 py-2.5 text-sm shadow-md">
      <p className="font-semibold text-foreground">{item.destinationCity}</p>
      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Jumlah Ritase</span>
          <span className="font-medium text-foreground tabular-nums">
            {item.tripCount} rit
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Total Omset</span>
          <span className="font-medium text-emerald-600 tabular-nums dark:text-emerald-400">
            {formatCurrency(item.totalOmset)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Total Profit</span>
          <span className="font-medium text-blue-600 tabular-nums dark:text-blue-400">
            {formatCurrency(item.totalProfit)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Avg Omset/Rit</span>
          <span className="font-medium text-foreground tabular-nums">
            {formatCurrency(item.avgOmset)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function DashboardRouteChart({ data }: DashboardRouteChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-50 items-center justify-center rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground">
          Belum ada data rute untuk ditampilkan
        </p>
      </div>
    )
  }

  const dynamicHeight = Math.max(200, data.length * 48 + 40)

  return (
    <ResponsiveContainer width="100%" height={dynamicHeight}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 12, left: -8, bottom: 4 }}
      >
        <CartesianGrid
          horizontal={false}
          strokeDasharray="3 3"
          className="stroke-border"
        />
        <XAxis
          type="number"
          dataKey="tripCount"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v} rit`}
          className="text-muted-foreground"
        />
        <YAxis
          type="category"
          dataKey="label"
          width={80}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
        />
        <Bar
          dataKey="tripCount"
          fill="hsl(var(--primary))"
          radius={[0, 4, 4, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
