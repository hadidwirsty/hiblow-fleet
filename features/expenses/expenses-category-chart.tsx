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
      <div className="h-55 w-full sm:h-65">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
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

      {/* Legend table */}
      <div className="space-y-1">
        {data.map((item) => (
          <div
            key={item.category}
            className="flex items-center justify-between rounded-md px-2 py-1 text-xs hover:bg-muted/50 sm:py-1.5 sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full sm:size-2.5"
                style={{ backgroundColor: item.fill }}
              />
              <span className="font-medium text-foreground">
                {item.category}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-right sm:gap-3">
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums sm:text-xs">
                {formatCurrency(item.total)}
              </span>
              <span className="w-10 text-right font-mono text-xs font-semibold text-foreground tabular-nums sm:w-12">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
