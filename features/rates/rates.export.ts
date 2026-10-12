import {
  calculateDistanceCostMetrics,
  resolveRowFinancialMetrics,
} from "@/features/rates/rates.calculations"
import { formatCityWithCode, formatPercentage } from "@/lib/utils"

import type { RateReference } from "@/db/schema"
import type { ExcelSheetData } from "@/lib/export/excel-builder"

export function formatRatesForExport(rates: RateReference[]): ExcelSheetData {
  const headers = [
    "No",
    "Pabrik Asal",
    "Kota Tujuan",
    "Tujuan Bongkar (Proyek / BP)",
    "Jarak (Km)",
    "Tarif OA / Ton (Rp)",
    "Tonase Standar (Ton)",
    "Estimasi Jumlah (Rp)",
    "Persentase Sangu (%)",
    "Sangu Supir (Rp)",
    "Tarif Lebih Tonase (Rp)",
    "Estimasi Profit (Rp)",
    "Pendapatan / Km (Rp)",
    "Estimasi Profit / Km (Rp)",
    "Potongan Khusus",
    "Status Rute",
  ]

  const rows = rates.map((rate, index) => {
    const { numRate, numTon, rowJumlah, rowSangu, rowProfit } =
      resolveRowFinancialMetrics(rate)
    const distanceMetrics = calculateDistanceCostMetrics({
      distanceKm: rate.distanceKm,
      rowJumlah,
      rowSangu,
      rowProfit,
    })
    const addRate = parseFloat(rate.additionalTonnageRate || "0")

    return [
      index + 1,
      rate.originPlant || rate.clientName,
      formatCityWithCode(rate.city, rate.cityCode),
      rate.destination,
      distanceMetrics.distanceKm ?? "-",
      numRate,
      numTon,
      rowJumlah,
      formatPercentage(rate.sanguPercentage),
      rowSangu,
      addRate,
      rowProfit,
      distanceMetrics.revenuePerKm ?? "-",
      distanceMetrics.profitPerKm ?? "-",
      rate.hasSpecialDeductions ? "LJU (1%, 2%, 5%)" : "-",
      rate.isActive ? "Aktif" : "Nonaktif",
    ]
  })

  return {
    sheetName: "Referensi Tarif Pabrik",
    headers,
    rows,
  }
}

export function getRatesExportFilename(
  extension: "xlsx" | "csv" = "xlsx"
): string {
  const dateStr = new Date().toISOString().split("T")[0]
  return `referensi-tarif-pabrik-${dateStr}.${extension}`
}
