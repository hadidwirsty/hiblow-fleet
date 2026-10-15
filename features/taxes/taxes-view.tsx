"use client"

import * as React from "react"

import { TaxComparisonCards } from "@/features/taxes/tax-comparison-cards"
import { TaxWithholdingCard } from "@/features/taxes/tax-withholding-card"
import { TaxAccountingTable } from "@/features/taxes/tax-accounting-table"
import { TaxSummary } from "@/features/taxes/tax-summary"
import { TaxYoyChart } from "@/features/taxes/tax-yoy-chart"
import { TaxesFilterBar } from "@/features/taxes/taxes-filter-bar"
import { exportTaxAccountingToExcel } from "@/features/taxes/taxes.export"
import type {
  TaxAccountingData,
  TaxYoyItem,
} from "@/features/taxes/taxes.queries"

interface TaxesViewProps {
  data: TaxAccountingData
  yoyData?: TaxYoyItem[]
}

export function TaxesView({ data, yoyData = [] }: TaxesViewProps) {
  const handleExportExcel = () => {
    exportTaxAccountingToExcel(data)
  }

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* 1. KPI Metric Summary Cards (Standard Dasbor / Ritase / Tarif) */}
      <TaxSummary data={data} />

      {/* 2. Filter Bar Terpadu & Tombol Aksi */}
      <TaxesFilterBar data={data} onExportExcel={handleExportExcel} />

      {/* 3. Kartu Komparasi 3 Skema Pajak & Rekomendasi Paling Hemat Kas */}
      <TaxComparisonCards calculations={data.calculations} />

      {/* 4. Kredit Pajak PPh 1% Terpotong Pabrik */}
      <TaxWithholdingCard
        tax1PctWithholding={data.tripMetrics.totalTax1PctWithholding}
        totalTrips={data.tripMetrics.totalTrips}
      />

      {/* 5. Tabel Pembukuan Fiskal Usaha Transportasi */}
      <TaxAccountingTable
        calculations={data.calculations}
        categoryBreakdown={data.expenseMetrics.categoryBreakdown}
        periodLabel={data.period.periodLabel}
      />

      {/* 6. Grafik Tren Pembukuan Antar-Tahun (YoY) */}
      {yoyData && yoyData.length > 0 && <TaxYoyChart yoyData={yoyData} />}
    </div>
  )
}
