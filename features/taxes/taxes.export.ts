import type { TaxAccountingData } from "@/features/taxes/taxes.queries"
import {
  buildExcelWorkbookBlob,
  type ExcelSheetData,
} from "@/lib/export/excel-builder"

export function formatTaxAccountingForExcel(
  data: TaxAccountingData
): ExcelSheetData[] {
  const {
    period,
    tripMetrics,
    expenseMetrics,
    calculations,
    withholdingTripDetails = [],
  } = data
  const { bookkeeping, schemes, recommendation } = calculations

  // Sheet 1: Komparasi Pajak
  const schemeHeaders = [
    "Skema Perhitungan Pajak",
    "Dasar Pengenaan Pajak (DPP)",
    "Tarif",
    "Pajak Terutang (Bruto)",
    "Kredit PPh 1% Terpotong",
    "Sisa Setoran Kas Riil",
    "Lebih Bayar",
    "Laba Bersih Setelah Pajak",
    "Status Rekomendasi",
  ]

  const schemeRows: (string | number)[][] = schemes.map((s) => [
    s.schemeName,
    s.dpp,
    s.rateDisplay,
    s.grossTax,
    s.taxCredit,
    s.netTaxPayable,
    s.taxOverpayment,
    s.realNetProfitAfterTax,
    s.isRecommended ? "Paling Hemat Kas (Direkomendasikan)" : "Opsi Alternatif",
  ])

  // Tambahkan baris rekomendasi cerdas
  schemeRows.push([])
  schemeRows.push([
    `Periode Laporan: ${period.periodLabel}`,
    `Kesimpulan: ${recommendation.explanation}`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ])

  // Sheet 2: Pembukuan Fiskal Usaha Transportasi
  const bookkeepingHeaders = [
    "Pos Keuangan",
    "Nilai Nominal (Rp)",
    "Keterangan Akuntansi",
  ]

  const bookkeepingRows: (string | number)[][] = [
    ["I. PENDAPATAN USAHA TRANSPORTASI", "", ""],
    [
      "Total Omset Ritase Truk",
      bookkeeping.grossOmset,
      `Total dari ${tripMetrics.totalTrips} ritase (${tripMetrics.totalTonnage} ton)`,
    ],
    [
      `Koreksi Penurunan Omset (${bookkeeping.revenueReductionRate * 100}%)`,
      -bookkeeping.revenueReduction,
      "Faktor koreksi penurunan peredaran usaha riil",
    ],
    ["Omset Usaha Bersih (Neto)", bookkeeping.netOmset, "Dasar omset riil"],
    ["", "", ""],
    ["II. BEBAN LANGSUNG RITASE (COGS)", "", ""],
    [
      "Sangu Supir All-In",
      bookkeeping.driverSangu,
      "BBM Solar, Tol, dan Uang Jalan",
    ],
    [
      "Insentif Ritase Supir",
      bookkeeping.driverIncentive,
      "Insentif supir per ton/rit",
    ],
    [
      "Biaya DO Pihak Ketiga",
      bookkeeping.thirdPartyFee,
      "Biaya order DO (Mas Wawan)",
    ],
    [
      "Potongan Operasional Pabrik",
      bookkeeping.factoryDeductions,
      "LJU 2% dan PPh 1% terpotong pabrik",
    ],
    [
      "Total Beban Langsung Ritase",
      bookkeeping.directTripExpenses,
      "Subtotal biaya langsung rit",
    ],
    ["", "", ""],
    ["III. BEBAN OPERASIONAL TRUK (OPEX)", "", ""],
  ]

  if (expenseMetrics.categoryBreakdown.length > 0) {
    for (const cat of expenseMetrics.categoryBreakdown) {
      bookkeepingRows.push([
        `Beban: ${cat.category}`,
        cat.total,
        `${cat.count} transaksi operasional`,
      ])
    }
  } else {
    bookkeepingRows.push([
      "Beban Operasional Tambahan",
      0,
      "Tidak ada transaksi tercatat",
    ])
  }

  bookkeepingRows.push([
    "Total Beban Operasional Truk",
    bookkeeping.truckOpex,
    "Mengecualikan kategori DP/Cicilan (belanja modal)",
  ])

  bookkeepingRows.push(["", "", ""])
  bookkeepingRows.push(["IV. LABA USAHA OPERASIONAL SEBELUM PAJAK", "", ""])
  bookkeepingRows.push([
    "Laba Usaha Riil Sebelum Pajak",
    bookkeeping.realOperatingProfit,
    "Omset Neto - (Beban Langsung + Beban Biaya Operasional)",
  ])

  // Sheet 3: Rekap Bukti Potong PPh 1%
  const withholdingHeaders = [
    "Parameter / No. SJ",
    "Nilai / Pabrik",
    "Dasar Aturan / Nomor Bukti Potong",
  ]

  const withholdingRows: (string | number)[][] = [
    [
      "Total Kredit Pajak Terakumulasi",
      tripMetrics.totalTax1PctWithholding,
      "Bukti potong PPh 1% langsung dari faktur tagihan semen",
    ],
    [
      "Jumlah Ritase Terkait Potongan PPh 1%",
      `${withholdingTripDetails.length} ritase`,
      "Khusus pabrik non-Grobogan (SI Tuban, SI Rembang, SBI Tuban)",
    ],
    [
      "Pabrik Pemotong PPh 1%",
      "Semen Indonesia (Tuban & Rembang), Solusi Bangun Indonesia (Tuban)",
      "Pabrik Indocement Grobogan tidak memotong PPh 1%",
    ],
    [
      "Kelayakan Kredit Pajak",
      "Sah sebagai pengurang PPh pada Skema Norma (29%) & Pembukuan Riil (11%)",
      "Tidak berlaku untuk Skema PPh Final UMKM 0.5%",
    ],
    ["", "", ""],
    ["RINCIAN BUKTI POTONG PER RITASE", "", ""],
    [
      "No. Surat Jalan | Tanggal Bongkar",
      "Pabrik / Omset (Rp) / PPh 1% (Rp)",
      "Nomor & Tanggal Bukti Potong",
    ],
  ]

  if (withholdingTripDetails.length > 0) {
    for (const trip of withholdingTripDetails) {
      const bupotInfo = trip.taxWithholdingNumber
        ? `${trip.taxWithholdingNumber} (${trip.taxWithholdingDate ?? "Tanpa Tgl"})`
        : "Belum Diinput"
      withholdingRows.push([
        `${trip.letterNumber} (${trip.unloadingDate})`,
        `${trip.factoryName} | Omset: ${trip.omset} | PPh 1%: ${trip.tax1Pct}`,
        bupotInfo,
      ])
    }
  } else {
    withholdingRows.push([
      "Tidak ada transaksi ritase dengan potongan PPh 1%",
      "-",
      "-",
    ])
  }

  return [
    {
      sheetName: "Komparasi Pajak",
      headers: schemeHeaders,
      rows: schemeRows,
    },
    {
      sheetName: "Pembukuan Fiskal Usaha",
      headers: bookkeepingHeaders,
      rows: bookkeepingRows,
    },
    {
      sheetName: "Rekap Bukti Potong PPh 1%",
      headers: withholdingHeaders,
      rows: withholdingRows,
    },
  ]
}

export function exportTaxAccountingToExcel(data: TaxAccountingData): void {
  const sheets = formatTaxAccountingForExcel(data)
  const blob = buildExcelWorkbookBlob({ sheets })

  const safePeriod = data.period.month
    ? `${data.period.year}_Bulan_${String(data.period.month).padStart(2, "0")}`
    : `${data.period.year}_Tahunan`

  const filename = `Laporan_Perpajakan_HW_Trans_${safePeriod}.xlsx`

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
