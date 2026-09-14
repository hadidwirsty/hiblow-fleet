export interface CategoryBreakdownItem {
  category: string
  total: number
  count: number
}

const CATEGORY_COLORS: Record<string, string> = {
  Servis: "hsl(25, 90%, 55%)",
  Onderdil: "hsl(210, 80%, 55%)",
  BBM: "hsl(45, 95%, 50%)",
  GPS: "hsl(260, 70%, 60%)",
  "DP/Cicilan": "hsl(340, 75%, 55%)",
  Administrasi: "hsl(160, 60%, 45%)",
  Lainnya: "hsl(0, 0%, 60%)",
}

const DEFAULT_COLOR = "hsl(0, 0%, 70%)"

export interface ChartCategoryItem extends CategoryBreakdownItem {
  percentage: number
  fill: string
}

export function prepareCategoryChartData(
  items: CategoryBreakdownItem[],
  totalExpenses: number
): ChartCategoryItem[] {
  return items.map((item) => ({
    ...item,
    percentage:
      totalExpenses > 0
        ? parseFloat(((item.total / totalExpenses) * 100).toFixed(1))
        : 0,
    fill: CATEGORY_COLORS[item.category] ?? DEFAULT_COLOR,
  }))
}
