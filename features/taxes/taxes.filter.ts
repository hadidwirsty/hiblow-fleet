import type { TaxAccountingFilter } from "@/features/taxes/taxes.queries"

export interface RawTaxSearchParams {
  year?: string
  month?: string
  truckId?: string
}

export function parseTaxSearchParams(
  params: RawTaxSearchParams
): TaxAccountingFilter {
  const currentYear = new Date().getFullYear()
  const parsedYear = params.year ? parseInt(params.year, 10) : currentYear
  const year = isNaN(parsedYear) ? currentYear : parsedYear

  let month: number | undefined
  if (params.month && params.month !== "ALL") {
    const m = parseInt(params.month, 10)
    if (!isNaN(m) && m >= 1 && m <= 12) {
      month = m
    }
  }

  let truckId: string | undefined
  if (params.truckId && params.truckId !== "ALL") {
    truckId = params.truckId
  }

  return { year, month, truckId }
}
