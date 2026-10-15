"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { formatCurrency } from "@/lib/utils"

import type { ChartCategoryItem } from "@/domain/expense-category"

interface ExpensesCategoryChartProps {
  data: ChartCategoryItem[]
  totalExpenses: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ChartCategoryItem }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="rounded-xl border border-border bg-popover/95 px-3 py-2 text-xs shadow-md backdrop-blur-xs">
      <p className="font-semibold text-popover-foreground">{item.category}</p>
      <p className="font-mono text-muted-foreground">
        {formatCurrency(item.total)}
      </p>
      <p className="text-[11px] font-medium text-primary">
        {item.percentage}% dari total beban
      </p>
    </div>
  )
}

export function ExpensesCategoryChart({
  data,
  totalExpenses,
}: ExpensesCategoryChartProps) {
  if (data.length === 0 || totalExpenses === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-xs text-muted-foreground">
          Belum ada catatan pengeluaran untuk ditampilkan dalam grafik
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
      {/* Visual Donut Chart */}
      <div className="h-52 w-full lg:col-span-5">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={82}
              paddingAngle={2}
              dataKey="total"
              nameKey="category"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Rincian Komposisi Legenda */}
      <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-muted/20 p-3 lg:col-span-7">
        <div className="mb-1.5 px-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Distribusi Kategori Biaya:
        </div>
        <div className="divide-y divide-border/40">
          {data.map((item) => (
            <div
              key={item.category}
              className="flex items-center justify-between px-2 py-1.5 text-xs transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="font-medium text-foreground">
                  {item.category}
                </span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(item.total)}
                </span>
                <span className="w-12 text-right font-mono text-xs font-semibold text-foreground tabular-nums">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
