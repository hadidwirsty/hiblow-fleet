import { formatCityWithCode, formatPercentage } from "@/lib/utils"

import type { RateReference } from "@/db/schema"
import type { ExcelSheetData } from "@/lib/export/excel-builder"

export function formatRatesForExport(rates: RateReference[]): ExcelSheetData {
  const headers = [
    "No",
    "Pabrik Asal",
    "Kota Tujuan",
    "Tujuan Bongkar (Proyek / BP)",
    "Tarif OA / Ton (Rp)",
    "Tonase Standar (Ton)",
    "Estimasi Jumlah (Rp)",
    "Persentase Sangu (%)",
    "Sangu Supir (Rp)",
    "Tarif Lebih Tonase (Rp)",
    "Estimasi Profit (Rp)",
    "Potongan Khusus",
    "Status Rute",
  ]

  const rows = rates.map((rate, index) => {
    const numRate = parseFloat(rate.ratePerTon || "0")
    const numTon = parseFloat(rate.standardTonnage || "31")
    const numPct = parseFloat(rate.sanguPercentage || "0")
    const rowJumlah = Math.round(numRate * numTon)
    const formulaSangu = Math.round(rowJumlah * numPct)

    const parsedDefaultSangu = rate.defaultSangu
      ? parseFloat(rate.defaultSangu)
      : 0
    const isLegacyThousandRounding =
      parsedDefaultSangu > 0 &&
      formulaSangu > 0 &&
      Math.abs(parsedDefaultSangu - Math.round(formulaSangu / 1000) * 1000) ===
        0 &&
      Math.abs(parsedDefaultSangu - formulaSangu) < 1000

    const rowSangu =
      parsedDefaultSangu > 0 && !isLegacyThousandRounding
        ? parsedDefaultSangu
        : formulaSangu

    const rowProfit = rowJumlah - rowSangu
    const addRate = parseFloat(rate.additionalTonnageRate || "0")

    return [
      index + 1,
      rate.originPlant || rate.clientName,
      formatCityWithCode(rate.city, rate.cityCode),
      rate.destination,
      numRate,
      numTon,
      rowJumlah,
      formatPercentage(rate.sanguPercentage),
      rowSangu,
      addRate,
      rowProfit,
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
