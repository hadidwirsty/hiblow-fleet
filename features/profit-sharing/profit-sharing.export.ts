import type { ProfitSharingPeriodDetail } from "@/features/profit-sharing/profit-sharing.queries"
import type { ExcelSheetData } from "@/lib/export/excel-builder"

export function formatProfitSharingForExcel(
  period: ProfitSharingPeriodDetail
): ExcelSheetData[] {
  const totalIncome = parseFloat(period.totalIncome || "0")
  const totalExpenses = parseFloat(period.totalExpenses || "0")
  const grossBalance = parseFloat(period.grossBalance || "0")
  const commissionAmount = parseFloat(period.managerCommissionAmount || "0")
  const distributableProfit = parseFloat(period.distributableProfit || "0")
  const fleetValuation = parseFloat(period.fleetValuation || "0")
  const managerProfit = parseFloat(period.managerProfit || "0")
  const managerTakeHome = parseFloat(period.managerTakeHome || "0")

  // Sheet 1: Financial & Management Summary
  const summaryHeaders = ["Pos Keuangan", "Nilai / Keterangan"]
  const summaryRows: (string | number)[][] = [
    ["Judul Periode", period.title],
    ["Tanggal Mulai", period.startDate],
    ["Tanggal Selesai", period.endDate],
    [
      "Status Periode",
      period.status === "finalized" ? "Finalized (Resmi)" : "Draft",
    ],
    ["Total Omset Ritase", totalIncome],
    ["Beban Operasional Riil", totalExpenses],
    ["Laba Kotor (Gross)", grossBalance],
    ["Komisi Pengelola (5%)", commissionAmount],
    ["Laba Bersih Siap Dibagi", distributableProfit],
    ["Valuasi Armada Acuan", fleetValuation],
    ["Hak Dividen Pengelola", managerProfit],
    ["Total Take-Home Pengelola", managerTakeHome],
  ]

  // Sheet 2: Investor Dividend Breakdown
  const investorHeaders = [
    "No.",
    "Nama Pemodal",
    "Modal Disetor (Rp)",
    "Porsi Saham (%)",
    "Hak Bagi Hasil (Rp)",
    "Catatan",
  ]

  let totalCapital = 0
  let totalPct = 0
  let totalPayout = 0

  const investorRows: (string | number)[][] = period.shares.map(
    (share, idx) => {
      const capital = parseFloat(share.capitalShare || "0")
      const pct = parseFloat(share.sharePercentage || "0") * 100
      const payout = parseFloat(share.payoutAmount || "0")

      totalCapital += capital
      totalPct += pct
      totalPayout += payout

      return [
        idx + 1,
        share.partnerName,
        capital,
        `${pct.toFixed(4)}%`,
        payout,
        share.notes ?? "-",
      ]
    }
  )

  // Append Total Row
  investorRows.push([
    "Total",
    "Semua Pemodal",
    totalCapital,
    `${totalPct.toFixed(2)}%`,
    totalPayout,
    "-",
  ])

  return [
    {
      sheetName: "Ringkasan Laba",
      headers: summaryHeaders,
      rows: summaryRows,
    },
    {
      sheetName: "Dividen Investor",
      headers: investorHeaders,
      rows: investorRows,
    },
  ]
}

export function formatProfitSharingForCsv(
  period: ProfitSharingPeriodDetail
): ExcelSheetData {
  const headers = [
    "Nama Pemodal / Pos",
    "Porsi (%) / Deskripsi",
    "Nominal (Rp)",
  ]

  const rows: (string | number)[][] = [
    ["[1. REKAPITULASI LAPORAN]", period.title, ""],
    [
      "Periode Tanggal Bongkar",
      `${period.startDate} s/d ${period.endDate}`,
      "",
    ],
    ["Status Tutup Buku", period.status.toUpperCase(), ""],
    ["Total Omset Ritase", "-", parseFloat(period.totalIncome || "0")],
    ["Beban Operasional Riil", "-", parseFloat(period.totalExpenses || "0")],
    ["Laba Kotor (Gross)", "-", parseFloat(period.grossBalance || "0")],
    [
      "Komisi Pengelola (5%)",
      "5.00%",
      parseFloat(period.managerCommissionAmount || "0"),
    ],
    [
      "Laba Bersih Siap Dibagi",
      "-",
      parseFloat(period.distributableProfit || "0"),
    ],
    ["", "", ""],
    ["[2. RINCIAN BAGI HASIL PEMODAL]", "MODAL DISOR", "HAK DIVIDEN"],
  ]

  for (const share of period.shares) {
    const capital = parseFloat(share.capitalShare || "0")
    const pct = parseFloat(share.sharePercentage || "0") * 100
    const payout = parseFloat(share.payoutAmount || "0")

    rows.push([
      share.partnerName,
      `${pct.toFixed(4)}% (Modal Rp ${capital.toLocaleString("id-ID")})`,
      payout,
    ])
  }

  return {
    sheetName: "Bagi Hasil",
    headers,
    rows,
  }
}

export function getProfitSharingExportFilename(
  period: ProfitSharingPeriodDetail,
  extension: "xlsx" | "csv" = "xlsx"
): string {
  const slug = period.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

  return `laporan-${slug || "bagi-hasil"}.${extension}`
}
