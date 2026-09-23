import type { Trip } from "@/db/schema"
import type { ExcelSheetData } from "@/lib/export/excel-builder"

export function formatTruckPlate(truckId: string): string {
  if (truckId === "W8187UA") return "W 8187 UA"
  if (truckId === "H8133OF") return "H 8133 OF"
  return truckId
}

export function formatTripsForExport(trips: Trip[]): ExcelSheetData {
  const headers = [
    "No. Surat Jalan",
    "Armada",
    "Tgl Order",
    "Tgl Bongkar",
    "Kota Tujuan",
    "Pabrik / Proyek Tujuan",
    "Tarif / Ton (Rp)",
    "Tonase Bongkar (Ton)",
    "Omset Bruto (Rp)",
    "Sangu Supir (Rp)",
    "Insentif Supir (Rp)",
    "Status Insentif",
    "Biaya DO Pihak Ketiga (Rp)",
    "Nama Pihak Ketiga",
    "Status Biaya DO",
    "Pajak 1% (Rp)",
    "Pot 2% LJU (Rp)",
    "Pot 5% UJ GRB (Rp)",
    "Laba Bersih (Rp)",
    "Catatan",
  ]

  const rows = trips.map((t) => [
    t.orderNumber,
    formatTruckPlate(t.truckId),
    t.orderDate,
    t.unloadingDate ?? "-",
    t.destinationCity,
    t.destinationName,
    parseFloat(t.ratePerTon || "0"),
    parseFloat(t.unloadedTonnage || "0"),
    parseFloat(t.omset || "0"),
    parseFloat(t.sangu || "0"),
    parseFloat(t.incentivePaid || "0"),
    t.incentiveStatus ?? "-",
    parseFloat(t.thirdPartyFee || "0"),
    t.thirdPartyName ?? "-",
    t.thirdPartyStatus ?? "-",
    parseFloat(t.tax1Pct || "0"),
    parseFloat(t.deduction2PctLju || "0"),
    parseFloat(t.deduction5PctUjGrb || "0"),
    parseFloat(t.profit || "0"),
    t.notes ?? "-",
  ])

  return {
    sheetName: "Rekap Ritase",
    headers,
    rows,
  }
}

export interface TripExportFilter {
  truckId?: string | null
  month?: string | number | null
  year?: string | number | null
}

export function getTripsExportFilename(
  filter?: TripExportFilter,
  extension: "xlsx" | "csv" = "xlsx"
): string {
  const parts: string[] = ["rekap-ritase"]

  if (filter?.truckId && filter.truckId !== "ALL") {
    parts.push(filter.truckId)
  }

  const hasYear = filter?.year && filter.year !== "ALL"
  const hasMonth = filter?.month && filter.month !== "ALL"

  if (hasYear && hasMonth) {
    const padMonth = String(filter.month).padStart(2, "0")
    parts.push(`${filter.year}-${padMonth}`)
  } else if (hasYear) {
    parts.push(String(filter.year))
  } else if (hasMonth) {
    const padMonth = String(filter.month).padStart(2, "0")
    parts.push(`bulan-${padMonth}`)
  }

  if (parts.length === 1) {
    parts.push("semua")
  }

  return `${parts.join("-")}.${extension}`
}
