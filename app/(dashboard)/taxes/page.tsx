import type { Metadata } from "next"
import { RiPercentLine } from "@remixicon/react"

import { Badge } from "@/components/ui/badge"
import {
  getTaxAccountingData,
  getTaxYoyData,
} from "@/features/taxes/taxes.queries"
import { parseTaxSearchParams } from "@/features/taxes/taxes.filter"
import { TaxesView } from "@/features/taxes/taxes-view"

export const dynamic = "force-dynamic"

interface TaxesPageProps {
  searchParams: Promise<{
    year?: string
    month?: string
    truckId?: string
  }>
}

export const metadata: Metadata = {
  title: "Perpajakan & Pembukuan",
  description:
    "Laporan pembukuan laba rugi usaha dan analisis komparasi 3 skema perpajakan resmi armada PT Hadya Wiran Trans",
}

export default async function TaxesPage({ searchParams }: TaxesPageProps) {
  const params = await searchParams
  const filter = parseTaxSearchParams(params)
  const [data, yoyData] = await Promise.all([
    getTaxAccountingData(filter),
    getTaxYoyData([2024, 2025, 2026]),
  ])

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Page Header (Standar Dasbor Operasional / Pencatatan Ritase / Referensi Tarif) */}
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <RiPercentLine className="size-4" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Perpajakan & Pembukuan
            </h1>
            <Badge variant="outline" className="text-xs font-normal">
              {data.period.periodLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Laporan pembukuan laba rugi usaha dan analisis komparasi 3 skema
            perpajakan resmi armada HW Trans
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full min-w-0 space-y-6 px-4 lg:px-6">
        <TaxesView data={data} yoyData={yoyData} />
      </div>
    </div>
  )
}
