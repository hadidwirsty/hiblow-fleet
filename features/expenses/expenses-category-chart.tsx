"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import type { ChartCategoryItem } from "@/domain/expense-category"
import { formatCurrency } from "@/lib/utils"

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
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-semibold text-foreground">{item.category}</p>
      <p className="text-muted-foreground">{formatCurrency(item.total)}</p>
      <p className="text-xs text-muted-foreground">
        {item.percentage}% dari total
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
      <div className="flex h-70 items-center justify-center rounded-xl border border-dashed">
        <p className="text-sm text-muted-foreground">
          Tidak ada data pengeluaran untuk ditampilkan
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
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

      {/* Legend table */}
      <div className="space-y-1.5">
        {data.map((item) => (
          <div
            key={item.category}
            className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="font-medium text-foreground">
                {item.category}
              </span>
            </div>
            <div className="flex items-center gap-3 text-right">
              <span className="text-muted-foreground tabular-nums">
                {formatCurrency(item.total)}
              </span>
              <span className="w-12 text-xs font-semibold text-foreground tabular-nums">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
