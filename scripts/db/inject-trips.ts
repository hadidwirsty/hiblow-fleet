import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"
import * as XLSX from "xlsx"

dotenv.config({ path: ".env.local" })

import { db, pool } from "@/db"
import { rateReferences, trips, trucks } from "@/db/schema"

const H_CSV_PATH = path.resolve(
  "./docs/csv/PERHITUNGAN HIBLOW HW Trans.xlsx - Masuk H8133OF (Ritase).csv"
)
const W_CSV_PATH = path.resolve(
  "./docs/csv/PERHITUNGAN HIBLOW HW Trans.xlsx - Masuk W8187UA (Ritase).csv"
)

const INDONESIAN_MONTHS: Record<string, string> = {
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

function parseIndonesianDate(dateStr: unknown): string | null {
  if (!dateStr) return null
  const str = String(dateStr).trim()
  if (str === "" || str === "-" || str === "undefined") return null

  // Format contoh: "Sabtu, 27 September 2025" atau "27 September 2025"
  const cleaned = str.replace(/^[a-zA-Z]+,\s*/, "").trim()
  const parts = cleaned.split(/\s+/)
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, "0")
    const month = INDONESIAN_MONTHS[parts[1].toLowerCase()]
    const year = parts[2]
    if (day && month && year) {
      return `${year}-${month}-${day}`
    }
  }
  return null
}

function parseCleanNumber(val: unknown, defaultVal = "0.00"): string {
  if (val === undefined || val === null) return defaultVal
  const str = String(val).trim()
  if (str === "" || str === "-" || str === "undefined") return defaultVal

  const cleaned = str
    .replace(/Rp/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[()]/g, "")
    .trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? defaultVal : num.toFixed(2)
}

function parseH8133OFTrips(): (typeof trips.$inferInsert)[] {
  if (!fs.existsSync(H_CSV_PATH)) {
    throw new Error(`Berkas CSV tidak ditemukan: ${H_CSV_PATH}`)
  }

  const content = fs.readFileSync(H_CSV_PATH, "utf-8")
  const wb = XLSX.read(content, { type: "string", raw: true })
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(
    wb.Sheets[wb.SheetNames[0]],
    {
      header: 1,
      raw: true,
    }
  )

  const parsed: (typeof trips.$inferInsert)[] = []

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue
    const no = parseInt(String(r[0] || "0").trim())
    if (isNaN(no) || no <= 0) continue

    const orderDate = parseIndonesianDate(r[1])
    if (!orderDate) continue

    const unloadingDate = parseIndonesianDate(r[2]) || orderDate
    const destinationCity = String(r[3] || "").trim()
    const destinationName = String(r[4] || "").trim()
    const ratePerTon = parseCleanNumber(r[5])
    const loadedTonnage =
      r[6] && String(r[6]).trim() !== "-" ? parseCleanNumber(r[6]) : null
    const unloadedTonnage = parseCleanNumber(r[7])
    const omset = parseCleanNumber(r[8])
    const tax1Pct = parseCleanNumber(r[9])
    const deduction2PctLju = parseCleanNumber(r[10])
    const deduction5PctUjGrb = parseCleanNumber(r[11])
    const sangu = parseCleanNumber(r[12])
    const profit = parseCleanNumber(r[13])
    const claim = parseCleanNumber(r[16])
    const claimDriver = parseCleanNumber(r[17])
    const incentiveRate = parseCleanNumber(r[19], "35000.00")
    const incentivePaid = parseCleanNumber(r[20])
    const incentiveStatus =
      r[21] && String(r[21]).trim() !== "-" ? String(r[21]).trim() : null
    const savings = parseCleanNumber(r[22])
    const mealAllowance = parseCleanNumber(r[24])

    const thirdPartyFee = parseCleanNumber(r[26])
    const thirdPartyStatus =
      r[27] && String(r[27]).trim() !== "-" ? String(r[27]).trim() : null
    const thirdPartyName =
      parseFloat(thirdPartyFee) > 0 ? "Mas Mawan (CV. Satria Perwira)" : null

    const rawNotes = r[28] ? String(r[28]).trim() : ""
    const notes = rawNotes && rawNotes !== "-" ? rawNotes : null

    parsed.push({
      truckId: "H8133OF",
      orderNumber: `H-${String(no).padStart(3, "0")}`,
      orderDate,
      unloadingDate,
      destinationCity,
      destinationName,
      ratePerTon,
      loadedTonnage,
      unloadedTonnage,
      omset,
      sangu,
      profit,
      tax1Pct,
      deduction2PctLju,
      deduction5PctUjGrb,
      incentiveRate,
      incentivePaid,
      incentiveStatus,
      thirdPartyFee,
      thirdPartyName,
      thirdPartyStatus,
      mealAllowance,
      savings,
      claim,
      claimDriver,
      notes,
    })
  }

  return parsed
}

function parseW8187UATrips(): (typeof trips.$inferInsert)[] {
  if (!fs.existsSync(W_CSV_PATH)) {
    throw new Error(`Berkas CSV tidak ditemukan: ${W_CSV_PATH}`)
  }

  const content = fs.readFileSync(W_CSV_PATH, "utf-8")
  const wb = XLSX.read(content, { type: "string", raw: true })
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(
    wb.Sheets[wb.SheetNames[0]],
    {
      header: 1,
      raw: true,
    }
  )

  const parsed: (typeof trips.$inferInsert)[] = []

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue
    const no = parseInt(String(r[0] || "0").trim())
    if (isNaN(no) || no <= 0) continue

    const orderDate = parseIndonesianDate(r[1])
    if (!orderDate) continue

    const unloadingDate = parseIndonesianDate(r[2]) || orderDate
    const destinationCity = String(r[3] || "").trim()
    const destinationName = String(r[4] || "").trim()
    const ratePerTon = parseCleanNumber(r[5])
    const loadedTonnage =
      r[6] && String(r[6]).trim() !== "-" ? parseCleanNumber(r[6]) : null
    const unloadedTonnage = parseCleanNumber(r[7])
    const omset = parseCleanNumber(r[8])
    const tax1Pct = parseCleanNumber(r[9])
    const deduction2PctLju = parseCleanNumber(r[10])
    const deduction5PctUjGrb = parseCleanNumber(r[11])
    const sangu = parseCleanNumber(r[12])
    const profit = parseCleanNumber(r[13])
    const claim = parseCleanNumber(r[16])
    const claimDriver = parseCleanNumber(r[17])
    const incentiveRate = parseCleanNumber(r[19], "35000.00")
    const incentivePaid = parseCleanNumber(r[20])
    const incentiveStatus =
      r[21] && String(r[21]).trim() !== "-" ? String(r[21]).trim() : null
    const mealAllowance = parseCleanNumber(r[22])
    const savings = parseCleanNumber(r[24])

    const mawanFee = parseCleanNumber(r[26])
    const mawanStatus =
      r[27] && String(r[27]).trim() !== "-" ? String(r[27]).trim() : null
    const mbahManFee = parseCleanNumber(r[28])
    const mbahManStatus =
      r[29] && String(r[29]).trim() !== "-" ? String(r[29]).trim() : null

    let thirdPartyFee = "0.00"
    let thirdPartyName: string | null = null
    let thirdPartyStatus: string | null = null

    const mawanNum = parseFloat(mawanFee)
    const mbahManNum = parseFloat(mbahManFee)

    if (mawanNum > 0 && mbahManNum > 0) {
      thirdPartyFee = (mawanNum + mbahManNum).toFixed(2)
      thirdPartyName = "Mas Mawan & Mbah Man"
      thirdPartyStatus = [mawanStatus, mbahManStatus]
        .filter(Boolean)
        .join(" | ")
    } else if (mawanNum > 0) {
      thirdPartyFee = mawanFee
      thirdPartyName = "Mas Mawan (CV. Satria Perwira)"
      thirdPartyStatus = mawanStatus
    } else if (mbahManNum > 0) {
      thirdPartyFee = mbahManFee
      thirdPartyName = "Mbah Man (SILOG)"
      thirdPartyStatus = mbahManStatus
    }

    const rawNotes = r[30] ? String(r[30]).trim() : ""
    const notes = rawNotes && rawNotes !== "-" ? rawNotes : null

    parsed.push({
      truckId: "W8187UA",
      orderNumber: `W-${String(no).padStart(3, "0")}`,
      orderDate,
      unloadingDate,
      destinationCity,
      destinationName,
      ratePerTon,
      loadedTonnage,
      unloadedTonnage,
      omset,
      sangu,
      profit,
      tax1Pct,
      deduction2PctLju,
      deduction5PctUjGrb,
      incentiveRate,
      incentivePaid,
      incentiveStatus,
      thirdPartyFee,
      thirdPartyName,
      thirdPartyStatus,
      mealAllowance,
      savings,
      claim,
      claimDriver,
      notes,
    })
  }

  return parsed
}

async function runInjection() {
  console.log(
    "================================================================="
  )
  console.log("🚀 MEMULAI INJEKSI DATA RITASE OPERASIONAL (TRIPS) KE DATABASE")
  console.log(
    "=================================================================\n"
  )

  // 1. Pastikan kedua truk terdaftar di tabel trucks
  console.log("🚛 Memverifikasi master armada (trucks)...")
  await db
    .insert(trucks)
    .values([
      {
        id: "H8133OF",
        plateNumber: "H 8133 OF",
        brandModel: "Hino 500 Tronton Hi-Blow",
        isActive: true,
      },
      {
        id: "W8187UA",
        plateNumber: "W 8187 UA",
        brandModel: "Hino 500 Tronton Hi-Blow",
        isActive: true,
      },
    ])
    .onConflictDoNothing()
  console.log("   ✅ Master armada H 8133 OF dan W 8187 UA siap.\n")

  // 2. Ambil master data tarif untuk menghubungkan rateReferenceId
  console.log("🔍 Mengambil master rateReferences untuk relasi tarif...")
  const allRates = await db.select().from(rateReferences)
  console.log(`   Ditemukan ${allRates.length} acuan tarif aktif.\n`)

  // 3. Parsing data ritase dari kedua berkas CSV
  const hTrips = parseH8133OFTrips()
  const wTrips = parseW8187UATrips()
  const allTrips = [...hTrips, ...wTrips]

  console.log(`📄 Berhasil membaca data ritase dari berkas CSV:`)
  console.log(`   - Truk H 8133 OF : ${hTrips.length} ritase`)
  console.log(`   - Truk W 8187 UA : ${wTrips.length} ritase`)
  console.log(`   - Total Ritase   : ${allTrips.length} ritase\n`)

  // 4. Pencocokan rateReferenceId
  let matchedCount = 0
  for (const t of allTrips) {
    const rateNum = parseFloat(t.ratePerTon)
    const match = allRates.find((m) => {
      const dbRate = parseFloat(m.ratePerTon)
      if (Math.abs(dbRate - rateNum) < 1) return true
      if (m.oaDriver && Math.abs(parseFloat(m.oaDriver) - rateNum) < 1)
        return true
      return false
    })

    if (match) {
      t.rateReferenceId = match.id
      matchedCount++
    }
  }

  console.log(
    `🔗 Relasi Tarif: ${matchedCount} dari ${allTrips.length} ritase (${((matchedCount / allTrips.length) * 100).toFixed(1)}%) terhubung langsung ke Master Tarif.\n`
  )

  // 5. Eksekusi insert batch ke database (batch 50)
  console.log(
    `📥 Mengunggah ${allTrips.length} ritase ke tabel 'trips' di database...`
  )
  const batchSize = 50
  for (let i = 0; i < allTrips.length; i += batchSize) {
    const batch = allTrips.slice(i, i + batchSize)
    await db.insert(trips).values(batch)
    console.log(
      `   ✅ Berhasil mengunggah batch ${i + 1} s/d ${i + batch.length}`
    )
  }

  // 6. Verifikasi akhir di database
  const totalDbTrips = await db.select().from(trips)
  const hCount = totalDbTrips.filter((t) => t.truckId === "H8133OF").length
  const wCount = totalDbTrips.filter((t) => t.truckId === "W8187UA").length

  console.log(
    "\n================================================================="
  )
  console.log("🎉 VERIFIKASI AKHIR DATABASE:")
  console.log(`   Total Surat Jalan Terdaftar : ${totalDbTrips.length} ritase`)
  console.log(`   - Ritase Truk H 8133 OF    : ${hCount} ritase`)
  console.log(`   - Ritase Truk W 8187 UA    : ${wCount} ritase`)
  console.log(
    "=================================================================\n"
  )

  await pool.end()
}

runInjection().catch((err) => {
  console.error("❌ Terjadi kesalahan saat injeksi trips:", err)
  pool.end().finally(() => process.exit(1))
})
