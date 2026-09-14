export interface RouteBreakdownItem {
  destinationCity: string
  tripCount: number
  totalOmset: number
  totalProfit: number
  avgOmset: number
}

const MAX_LABEL_LENGTH = 12

export interface ChartRouteItem extends RouteBreakdownItem {
  label: string
  omsetJuta: number
  profitJuta: number
}

function truncateLabel(city: string): string {
  if (city.length <= MAX_LABEL_LENGTH) return city
  return city.slice(0, MAX_LABEL_LENGTH) + "…"
}

export function prepareRouteChartData(
  items: RouteBreakdownItem[]
): ChartRouteItem[] {
  return items.map((item) => ({
    ...item,
    label: truncateLabel(item.destinationCity),
    omsetJuta: parseFloat((item.totalOmset / 1_000_000).toFixed(1)),
    profitJuta: parseFloat((item.totalProfit / 1_000_000).toFixed(1)),
  }))
}
