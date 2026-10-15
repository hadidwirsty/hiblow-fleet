import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

import { db, pool } from "@/db"
import { expenses, trucks } from "@/db/schema"
import type { NewExpense } from "@/db/schema"

const H_CSV_PATH = path.resolve(
  "./docs/csv/PERHITUNGAN HIBLOW HW Trans.xlsx - Pengeluaran H8133OF.csv"
)
const W_CSV_PATH = path.resolve(
  "./docs/csv/PERHITUNGAN HIBLOW HW Trans.xlsx - Pengeluaran W8187UA.csv"
)

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += c
    }
  }
  result.push(current.trim())
  return result
}

const MONTH_MAP: Record<string, string> = {
  januari: "01",
  februari: "02",
  maret: "03",
  april: "04",
  mei: "05",
  juni: "06",
  juli: "07",
  agustus: "08",
  september: "09",
  oktober: "10",
  november: "11",
  desember: "12",
}

function parseIndonesianDate(raw: string): string | null {
  if (!raw) return null
  const clean = raw.replace(/,/g, "").trim()
  const parts = clean.split(/\s+/)
  if (parts.length >= 4) {
    const day = parts[1].padStart(2, "0")
    const mKey = parts[2].toLowerCase().replace("2026", "").replace("2025", "")
    const month = MONTH_MAP[mKey] || MONTH_MAP[parts[2].toLowerCase()]
    const year = parts[3]
    if (day && month && year) return `${year}-${month}-${day}`
  }
  return null
}

function parseIndonesianMoney(val: string): number {
  if (!val || val === "-" || val === "0,00" || val === "0") return 0
  const clean = val.replace(/\./g, "").replace(/,/g, ".")
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

export function classifyExpense(desc: string): string {
  const d = desc.toLowerCase()

  // 1. DP / Cicilan / Pembelian unit
  if (
    d.includes("dp truk") ||
    d.includes("pembayaran truk") ||
    d.includes("pelunasan truk") ||
    d.includes("pembayaran ke truk")
  ) {
    return "DP/Cicilan"
  }

  // 2. GPS
  if (d.includes("gps")) {
    return "GPS"
  }

  // 3. Administrasi & Legalitas
  if (
    d.includes("stnk") ||
    d.includes("biro") ||
    d.includes("silog") ||
    d.includes("pajak") ||
    d.includes("kir") ||
    d.includes("barcode truk") ||
    d.includes("klaim muatan") ||
    d.includes("pak udin stop")
  ) {
    return "Administrasi"
  }

  // 4. BBM / Bahan Bakar
  if (d.includes("solar") || d.includes("bbm") || d.includes("bensin")) {
    return "BBM"
  }

  // 5. Servis & Jasa Perawatan
  if (
    d.includes("jasa") ||
    d.includes("servis") ||
    d.includes("service") ||
    d.includes("perbaikkan") ||
    d.includes("perbaikan") ||
    d.includes("tambal") ||
    d.includes("tambel") ||
    d.includes("las ") ||
    d.startsWith("las") ||
    d.includes("cuci") ||
    d.includes("bongkar pasang") ||
    d.includes("bongkar + pasang") ||
    d.includes("setting") ||
    d.includes("sporing") ||
    d.includes("spooring") ||
    d.includes("storing") ||
    d.includes("semprot") ||
    d.includes("turun mesin") ||
    d.includes("stel ") ||
    d.includes("setel ") ||
    d.includes("stell ") ||
    d.includes("oper velg") ||
    d.includes("oper ban") ||
    d.includes("press ban") ||
    d.includes("kontrol angin") ||
    d.includes("uj kosongan") ||
    d.includes("kaca kanan anjlok") ||
    d.includes("tambah angin") ||
    d.includes("ngevet") ||
    d.includes("bikin bushing") ||
    d.includes("ngetips") ||
    d.includes("pengecekkan") ||
    d.includes("rotasi ban") ||
    d.includes("solder") ||
    d.includes("cek angin") ||
    d.includes("kontrol ban") ||
    d.includes("pasang") ||
    d.includes("strum accu") ||
    d.includes("kerok semen") ||
    d.includes("tips") ||
    d.includes("impact") ||
    d.includes("impect") ||
    d.includes("ganti brostel") ||
    d.includes("ganti ic") ||
    d.includes("jas temen") ||
    d.includes("ganti valve") ||
    d.includes("pembersihan dalam") ||
    d.includes("repair otomatis")
  ) {
    return "Servis"
  }

  // 6. Onderdil / Suku Cadang / Pelumas
  if (
    d.includes("ban ") ||
    d.startsWith("ban") ||
    d.includes("oli") ||
    d.includes("filter") ||
    d.includes("selang") ||
    d.includes("aki") ||
    d.includes("accu") ||
    d.includes("radiator") ||
    d.includes("karet") ||
    d.includes("marset") ||
    d.includes("velg") ||
    d.includes("seal") ||
    d.includes("baut") ||
    d.includes("kabel") ||
    d.includes("lampu") ||
    d.includes("regulator") ||
    d.includes("neple") ||
    d.includes("coolant") ||
    d.includes("cololant") ||
    d.includes("hikari") ||
    d.includes("tutup ") ||
    d.includes("bos ") ||
    d.includes("kawel") ||
    d.includes("spion") ||
    d.includes("hcl") ||
    d.includes("stempet") ||
    d.includes("stampet") ||
    d.includes("kampas") ||
    d.includes("arslet") ||
    d.includes("willbut") ||
    d.includes("pompa solar") ||
    d.includes("dinamo") ||
    d.includes("air aki") ||
    d.includes("valve") ||
    d.includes("lem ") ||
    d.includes("grease") ||
    d.includes("minyak rem") ||
    d.includes("minyak rek") ||
    d.includes("ledeng rem") ||
    d.includes("klem") ||
    d.includes("dop") ||
    d.includes("alarm mundur") ||
    d.includes("rellay") ||
    d.includes("relay") ||
    d.includes("socket") ||
    d.includes("rumah sikring") ||
    d.includes("sikring") ||
    d.includes("switch sensor") ||
    d.includes("packing") ||
    d.includes("park head") ||
    d.includes("park turbo") ||
    d.includes("pak dek") ||
    d.includes("bushing") ||
    d.includes("bearing") ||
    d.includes("laker") ||
    d.includes("klaker") ||
    d.includes("cross joint") ||
    d.includes("mur") ||
    d.includes("pipa") ||
    d.includes("thermostat") ||
    d.includes("spakbor") ||
    d.includes("stoplamp") ||
    d.includes("sunduk per") ||
    d.includes("talang air") ||
    d.includes("u bolt") ||
    d.includes("water outlet") ||
    d.includes("wiper") ||
    d.includes("meditran") ||
    d.includes("vet") ||
    d.includes("ring") ||
    d.includes("metal") ||
    d.includes("liner") ||
    d.includes("shock breaker") ||
    d.includes("pen per") ||
    d.includes("per gas") ||
    d.includes("flasher") ||
    d.includes("cylinder rem") ||
    d.includes("snel rem") ||
    d.includes("repair kit") ||
    d.includes("kunci pintu") ||
    d.includes("door lock") ||
    d.includes("doorlock") ||
    d.includes("handle") ||
    d.includes("as roda") ||
    d.includes("flange") ||
    d.includes("stopper") ||
    d.includes("areng hori") ||
    d.includes("ontelan kaca") ||
    d.includes("skun") ||
    d.includes("terminal a") ||
    d.includes("silicon") ||
    d.includes("kran") ||
    d.includes("tube") ||
    d.includes("kondom nozzle") ||
    d.includes("sela as kruk") ||
    d.includes("master power shift") ||
    d.includes("jok join") ||
    d.includes("cover angin") ||
    d.includes("plastik versenling") ||
    d.includes("saklar rotari") ||
    d.includes("tuker tambah") ||
    d.includes("tukar tambah")
  ) {
    return "Onderdil"
  }

  // 7. Lainnya (Perlengkapan K3, Cat/Thiner, Alat Kerja, Akomodasi/Makan, Part Bekas Terjual)
  return "Lainnya"
}

function parseExpensesCSV(
  filePath: string,
  truckId: "W8187UA" | "H8133OF",
  endLine: number
): NewExpense[] {
  const isW = truckId === "W8187UA"
  const lines = fs.readFileSync(filePath, "utf-8").split("\n")
  const results: NewExpense[] = []
  let lastDate = ""

  for (let i = 1; i < endLine; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const cols = parseCSVLine(line)

    const rawDate = cols[1]
    if (rawDate) lastDate = rawDate

    const desc = cols[2]
    const qty = cols[3]
    const nom = parseIndonesianMoney(cols[4])
    const adm = isW ? parseIndonesianMoney(cols[5]) : 0
    const loc = isW ? cols[6] : cols[5]
    const notes = isW ? cols[7] : cols[6]

    if (!desc && nom === 0) continue

    const isoDate = parseIndonesianDate(lastDate)
    if (!isoDate) {
      throw new Error(
        `Gagal mem-parsing tanggal "${lastDate}" pada baris ${i + 1}`
      )
    }

    const cleanQty = qty && qty.trim() ? qty.trim() : null
    const finalDesc = desc.trim()
    const category = classifyExpense(
      cleanQty ? `${finalDesc} (${cleanQty})` : finalDesc
    )

    results.push({
      truckId,
      expenseDate: isoDate,
      category,
      description: finalDesc,
      quantity: cleanQty,
      amount: nom.toFixed(2),
      adminFee: adm.toFixed(2),
      location: loc && loc.trim() ? loc.trim() : null,
      repairNotes: notes && notes.trim() ? notes.trim() : null,
    })
  }

  return results
}

async function runInjection() {
  console.log(
    "================================================================="
  )
  console.log("🚛 MEMULAI INJEKSI DATA PENGELUARAN ARMADA HW TRANS")
  console.log(
    "=================================================================\n"
  )

  // 1. Verifikasi data armada
  console.log("🔍 Memverifikasi ketersediaan armada di database...")
  const allTrucks = await db.select().from(trucks)
  const truckIds = allTrucks.map((t) => t.id)
  console.log(`   Armada terdaftar: ${truckIds.join(", ")}\n`)

  if (!truckIds.includes("W8187UA") || !truckIds.includes("H8133OF")) {
    throw new Error("Armada W8187UA atau H8133OF belum terdaftar di database!")
  }

  // 2. Parsing berkas CSV
  console.log("📄 Membaca dan mem-parsing berkas CSV pengeluaran...")
  const hExpenses = parseExpensesCSV(H_CSV_PATH, "H8133OF", 587)
  const wExpenses = parseExpensesCSV(W_CSV_PATH, "W8187UA", 660)
  const allExpenses = [...hExpenses, ...wExpenses]

  console.log(`   - Truk H 8133 OF : ${hExpenses.length} transaksi`)
  console.log(`   - Truk W 8187 UA : ${wExpenses.length} transaksi`)
  console.log(`   - Total Transaksi: ${allExpenses.length} baris\n`)

  // 3. Bersihkan data pengeluaran lama untuk kedua truk (idempoten)
  console.log("🧹 Membersihkan catatan pengeluaran lama di database...")
  await db.delete(expenses)
  console.log("   ✅ Data pengeluaran lama berhasil dikosongkan.\n")

  // 4. Batch insertion (batch 100)
  console.log(
    `📥 Mengunggah ${allExpenses.length} transaksi ke tabel 'expenses'...`
  )
  const batchSize = 100
  for (let i = 0; i < allExpenses.length; i += batchSize) {
    const batch = allExpenses.slice(i, i + batchSize)
    await db.insert(expenses).values(batch)
    console.log(
      `   ✅ Berhasil mengunggah batch baris ${i + 1} s/d ${i + batch.length}`
    )
  }

  // 5. Verifikasi dan agregasi hasil dari database
  console.log("\n📊 Mengambil rekapitulasi data dari database Neon...")
  const dbRecords = await db.select().from(expenses)

  let totalNomH = 0
  let totalAdmH = 0
  let countH = 0

  let totalNomW = 0
  let totalAdmW = 0
  let countW = 0

  const categorySummary: Record<string, { count: number; total: number }> = {}

  for (const r of dbRecords) {
    const nom = parseFloat(String(r.amount)) || 0
    const adm = parseFloat(String(r.adminFee)) || 0
    const cat = r.category

    if (r.truckId === "H8133OF") {
      countH++
      totalNomH += nom
      totalAdmH += adm
    } else if (r.truckId === "W8187UA") {
      countW++
      totalNomW += nom
      totalAdmW += adm
    }

    if (!categorySummary[cat]) {
      categorySummary[cat] = { count: 0, total: 0 }
    }
    categorySummary[cat].count++
    categorySummary[cat].total += nom + adm
  }

  console.log(
    "\n================================================================="
  )
  console.log("🎉 REKAPITULASI HASIL INJEKSI DATABASE NEON:")
  console.log(`   Total Transaksi Disimpan: ${dbRecords.length} transaksi`)
  console.log(
    "-----------------------------------------------------------------"
  )
  console.log(`   1. Truk H 8133 OF:`)
  console.log(`      - Transaksi: ${countH} baris`)
  console.log(`      - Nominal  : Rp ${totalNomH.toLocaleString("id-ID")}`)
  console.log(`      - Admin Fee: Rp ${totalAdmH.toLocaleString("id-ID")}`)
  console.log(
    `      - Total    : Rp ${(totalNomH + totalAdmH).toLocaleString("id-ID")}`
  )
  console.log(
    "-----------------------------------------------------------------"
  )
  console.log(`   2. Truk W 8187 UA:`)
  console.log(`      - Transaksi: ${countW} baris`)
  console.log(`      - Nominal  : Rp ${totalNomW.toLocaleString("id-ID")}`)
  console.log(`      - Admin Fee: Rp ${totalAdmW.toLocaleString("id-ID")}`)
  console.log(
    `      - Total    : Rp ${(totalNomW + totalAdmW).toLocaleString("id-ID")}`
  )
  console.log(
    "-----------------------------------------------------------------"
  )
  console.log(
    `   TOTAL GABUNGAN OPERASIONAL & ASET: Rp ${(totalNomH + totalAdmH + totalNomW + totalAdmW).toLocaleString("id-ID")}`
  )
  console.log(
    "================================================================="
  )
  console.log("🏷️  RINCIAN PER KATEGORI:")
  for (const [cat, data] of Object.entries(categorySummary).sort(
    (a, b) => b[1].total - a[1].total
  )) {
    console.log(
      `   - ${cat.padEnd(14)}: ${data.count.toString().padStart(3)} transaksi | Rp ${data.total.toLocaleString("id-ID").padStart(15)}`
    )
  }
  console.log(
    "=================================================================\n"
  )

  await pool.end()
}

runInjection().catch((err) => {
  console.error("❌ Terjadi kesalahan saat injeksi pengeluaran:", err)
  pool.end().finally(() => process.exit(1))
})
