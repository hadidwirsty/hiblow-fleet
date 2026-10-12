import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"
import * as XLSX from "xlsx"

dotenv.config({ path: ".env.local" })

import { db, pool } from "@/db"
import { rateReferences } from "@/db/schema"
import { eq } from "drizzle-orm"

const CSV_PATH = path.resolve(
  "./docs/csv/PERHITUNGAN HIBLOW HW Trans.xlsx - Solusi Bangun Indonesia (SB) - Tuban.csv"
)
const RATES_JSON_PATH = path.resolve("./db/data/rates.json")

const ORIGIN_PLANT = "Solusi Bangun Indonesia (SBI) - Tuban"
const CLIENT_NAME = "Solusi Bangun Indonesia (SBI) - Tuban"

function parseCleanNumber(val: unknown): string {
  if (val === undefined || val === null || val === "") return "0.00"
  const cleaned = String(val).trim().replace(/\./g, "").replace(/,/g, ".")
  const num = parseFloat(cleaned)
  return isNaN(num) ? "0.00" : num.toFixed(2)
}

function calculateSanguPercentage(sanguStr: string, jumlahStr: string): string {
  const sangu = parseFloat(sanguStr) || 0
  const jumlah = parseFloat(jumlahStr) || 0
  if (jumlah <= 0) return "0.5000000"

  const rawRatio = sangu / jumlah
  if (Math.abs(rawRatio - 0.5) < 0.0001) {
    return "0.5000000"
  }
  return rawRatio.toFixed(7)
}

interface ParsedSbiRow {
  no: number
  movement: string
  materialGroup: string
  city: string
  cityCode: string | null
  destination: string
  distanceKm: string
  ratePerTon: string
  standardTonnage: string
  defaultSangu: string
  sanguPercentage: string
  additionalTonnageRate: string
}

function parseAndDeduplicateCsv(): {
  uniqueRows: ParsedSbiRow[]
  duplicateSkipped: { duplicateNo: number; originalNo: number; name: string }[]
} {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`File CSV tidak ditemukan pada path: ${CSV_PATH}`)
  }

  const rawContent = fs.readFileSync(CSV_PATH, "utf-8")
  const wb = XLSX.read(rawContent, { type: "string", raw: true })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rawRows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(
    sheet,
    {
      header: 1,
      raw: true,
    }
  )

  const parsedList: ParsedSbiRow[] = []

  for (let i = 2; i < rawRows.length; i++) {
    const r = rawRows[i]
    if (!r) continue
    const rawNo = parseInt(String(r[0] || "0"), 10)
    if (isNaN(rawNo) || rawNo <= 0) continue

    const movement = String(r[1] || "").trim()
    const materialGroup = String(r[2] || "").trim()
    const city = String(r[3] || "").trim()
    const cityCode =
      r[4] !== undefined && r[4] !== null && String(r[4]).trim() !== ""
        ? String(r[4]).trim()
        : null
    const rawDest =
      r[5] !== undefined && r[5] !== null ? String(r[5]).trim() : ""
    const destination = rawDest || city
    const distanceKm = parseCleanNumber(r[6])
    const ratePerTon = parseCleanNumber(r[7])
    const standardTonnage = parseCleanNumber(r[8]) || "31.00"
    const estimatedJumlah = parseCleanNumber(r[9])
    const defaultSangu = parseCleanNumber(r[10])
    const additionalTonnageRate = parseCleanNumber(r[12])

    const sanguPercentage = calculateSanguPercentage(
      defaultSangu,
      estimatedJumlah
    )

    parsedList.push({
      no: rawNo,
      movement,
      materialGroup,
      city,
      cityCode,
      destination,
      distanceKm,
      ratePerTon,
      standardTonnage,
      defaultSangu,
      sanguPercentage,
      additionalTonnageRate,
    })
  }

  // Deduplikasi: Jika benar-benar identik 100% pada rute, jarak, tarif, dan sangu, gabung menjadi 1 entri unik
  const uniqueRows: ParsedSbiRow[] = []
  const duplicateSkipped: {
    duplicateNo: number
    originalNo: number
    name: string
  }[] = []

  for (const row of parsedList) {
    const isIdentical = uniqueRows.find(
      (u) =>
        u.city.toUpperCase() === row.city.toUpperCase() &&
        u.destination.toUpperCase() === row.destination.toUpperCase() &&
        (u.cityCode || "") === (row.cityCode || "") &&
        u.ratePerTon === row.ratePerTon &&
        u.standardTonnage === row.standardTonnage &&
        u.defaultSangu === row.defaultSangu &&
        u.additionalTonnageRate === row.additionalTonnageRate
    )

    if (isIdentical) {
      duplicateSkipped.push({
        duplicateNo: row.no,
        originalNo: isIdentical.no,
        name: `${row.city} - ${row.destination}`,
      })
    } else {
      uniqueRows.push(row)
    }
  }

  return { uniqueRows, duplicateSkipped }
}

async function runInjection() {
  console.log("=======================================================")
  console.log("🚀 MEMULAI INJEKSI DATA TARIF SBI TUBAN KE DATABASE")
  console.log("=======================================================\n")

  const { uniqueRows, duplicateSkipped } = parseAndDeduplicateCsv()
  console.log(
    `📄 Berhasil membaca 165 baris data dari CSV (${uniqueRows.length} rute unik setelah deduplikasi identik):`
  )
  console.log(`   Path: ${CSV_PATH}`)
  console.log(
    `   Duplikasi identik yang digabung: ${duplicateSkipped.length} baris:`
  )
  for (const d of duplicateSkipped) {
    console.log(
      `     - No.${d.duplicateNo} (${d.name}) digabung ke No.${d.originalNo}`
    )
  }
  console.log("")

  // 1. Ambil seluruh data rute SBI Tuban yang sudah ada di database saat ini
  const existingSbi = await db
    .select()
    .from(rateReferences)
    .where(eq(rateReferences.originPlant, ORIGIN_PLANT))

  console.log(
    `🔍 Data '${ORIGIN_PLANT}' yang ada di database saat ini: ${existingSbi.length} rute`
  )

  // 2. Kategorikan: Rute untuk Update vs Rute Baru untuk Insert
  const toUpdate: { id: string; row: ParsedSbiRow; reason: string }[] = []
  const toInsert: (typeof rateReferences.$inferInsert)[] = []
  const retainedUnmatched: typeof existingSbi = []

  const matchedExistingIds = new Set<string>()

  for (const row of uniqueRows) {
    // Cari kecocokan di database berdasarkan kota, tujuan, dan toleransi tarif
    const dbMatch = existingSbi.find(
      (ext) =>
        ext.city.toUpperCase() === row.city.toUpperCase() &&
        ext.destination.toUpperCase() === row.destination.toUpperCase() &&
        Math.abs(parseFloat(ext.ratePerTon) - parseFloat(row.ratePerTon)) < 1
    )

    if (dbMatch) {
      matchedExistingIds.add(dbMatch.id)
      const sanguDiff = Math.abs(
        parseFloat(dbMatch.defaultSangu || "0") - parseFloat(row.defaultSangu)
      )
      const addDiff = Math.abs(
        parseFloat(dbMatch.additionalTonnageRate || "0") -
          parseFloat(row.additionalTonnageRate)
      )

      if (sanguDiff > 1 || addDiff > 1) {
        toUpdate.push({
          id: dbMatch.id,
          row,
          reason: `Pembaruan nominal (Sangu: ${dbMatch.defaultSangu} -> ${row.defaultSangu})`,
        })
      } else {
        toUpdate.push({
          id: dbMatch.id,
          row,
          reason: `Penyelarasan desimal tarif & kelengkapan cityCode/distanceKm`,
        })
      }
    } else {
      toInsert.push({
        originPlant: ORIGIN_PLANT,
        clientName: CLIENT_NAME,
        city: row.city,
        cityCode: row.cityCode,
        destination: row.destination,
        distanceKm: row.distanceKm,
        ratePerTon: row.ratePerTon,
        standardTonnage: row.standardTonnage,
        sanguPercentage: row.sanguPercentage,
        defaultSangu: row.defaultSangu,
        additionalTonnageRate: row.additionalTonnageRate,
        hasSpecialDeductions: false,
        isActive: true,
      })
    }
  }

  for (const ext of existingSbi) {
    if (!matchedExistingIds.has(ext.id)) {
      retainedUnmatched.push(ext)
    }
  }

  console.log(`\n📊 Rencana Pemrosesan Data:`)
  console.log(
    `   - Rute di Database yang diperbarui (ID dipertahankan): ${toUpdate.length} rute`
  )
  console.log(
    `   - Rute baru yang akan dimasukkan (INSERT):             ${toInsert.length} rute`
  )
  console.log(
    `   - Rute historis di DB yang tetap dipertahankan:        ${retainedUnmatched.length} rute`
  )
  for (const r of retainedUnmatched) {
    console.log(`       * ${r.city} - ${r.destination} (ID: ${r.id})`)
  }
  console.log("")

  // 3. Eksekusi UPDATE pada rute yang sudah ada
  if (toUpdate.length > 0) {
    console.log(
      `🔄 Memperbarui ${toUpdate.length} rute yang sudah ada di database...`
    )
    for (const item of toUpdate) {
      await db
        .update(rateReferences)
        .set({
          ratePerTon: item.row.ratePerTon,
          standardTonnage: item.row.standardTonnage,
          defaultSangu: item.row.defaultSangu,
          sanguPercentage: item.row.sanguPercentage,
          additionalTonnageRate: item.row.additionalTonnageRate,
          cityCode: item.row.cityCode,
          distanceKm: item.row.distanceKm,
          clientName: CLIENT_NAME,
        })
        .where(eq(rateReferences.id, item.id))
      console.log(
        `   ✅ Updated [${item.id.slice(0, 8)}...] ${item.row.city} - ${item.row.destination} (${item.reason})`
      )
    }
    console.log("")
  }

  // 4. Eksekusi INSERT pada rute baru (batch 50)
  if (toInsert.length > 0) {
    console.log(`📥 Memasukkan ${toInsert.length} rute baru ke database...`)
    const batchSize = 50
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize)
      await db.insert(rateReferences).values(batch)
      console.log(
        `   ✅ Berhasil mengunggah batch ${i + 1} s/d ${i + batch.length}`
      )
    }
    console.log("")
  }

  // 5. Verifikasi hasil akhir di database
  const finalSbi = await db
    .select()
    .from(rateReferences)
    .where(eq(rateReferences.originPlant, ORIGIN_PLANT))

  const totalAllRates = await db.select().from(rateReferences)

  console.log("=======================================================")
  console.log(`🎉 VERIFIKASI AKHIR DATABASE:`)
  console.log(`   Pabrik Asal: ${ORIGIN_PLANT}`)
  console.log(`   Total Rute SBI Tuban di Database: ${finalSbi.length} rute`)
  console.log(
    `   Total Seluruh Rute (Semua Pabrik): ${totalAllRates.length} rute`
  )
  console.log("=======================================================")

  // 6. Sinkronisasi ke db/data/rates.json
  if (fs.existsSync(RATES_JSON_PATH)) {
    console.log("\n💾 Memperbarui data acuan di db/data/rates.json...")
    const currentRatesJson: (typeof rateReferences.$inferInsert)[] = JSON.parse(
      fs.readFileSync(RATES_JSON_PATH, "utf-8")
    )

    // Simpan rute pabrik lain
    const otherRates = currentRatesJson.filter(
      (r) =>
        r.originPlant !== ORIGIN_PLANT &&
        r.clientName !== CLIENT_NAME &&
        r.clientName !== "Solusi Bangun Indonesia (SBI) - Tuban" &&
        r.clientName !== "SBI"
    )

    const updatedSbiRates: (typeof rateReferences.$inferInsert)[] =
      finalSbi.map((r) => ({
        originPlant: ORIGIN_PLANT,
        clientName: CLIENT_NAME,
        city: r.city,
        cityCode: r.cityCode,
        destination: r.destination,
        distanceKm: r.distanceKm,
        ratePerTon: r.ratePerTon,
        standardTonnage: r.standardTonnage,
        sanguPercentage: r.sanguPercentage,
        defaultSangu: r.defaultSangu,
        additionalTonnageRate: r.additionalTonnageRate,
        hasSpecialDeductions: r.hasSpecialDeductions,
        isActive: r.isActive,
      }))

    const newRatesJson = [...otherRates, ...updatedSbiRates]
    fs.writeFileSync(
      RATES_JSON_PATH,
      JSON.stringify(newRatesJson, null, 2),
      "utf-8"
    )
    console.log(
      `   ✅ db/data/rates.json berhasil disinkronkan (${updatedSbiRates.length} rute SBI Tuban, Total: ${newRatesJson.length} rute).\n`
    )
  }

  await pool.end()
}

runInjection().catch((err) => {
  console.error("❌ Terjadi kesalahan saat injeksi SBI Tuban:", err)
  pool.end().finally(() => process.exit(1))
})
