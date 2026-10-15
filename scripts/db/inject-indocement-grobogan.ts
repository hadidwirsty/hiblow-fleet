import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"
import * as XLSX from "xlsx"

dotenv.config({ path: ".env.local" })

import { db, pool } from "@/db"
import { rateReferences } from "@/db/schema"
import { eq } from "drizzle-orm"

const CSV_PATH = path.resolve(
  "./docs/csv/PERHITUNGAN HIBLOW HW Trans.xlsx - Indocement - Grobogan.csv"
)
const RATES_JSON_PATH = path.resolve("./db/data/rates.json")

const ORIGIN_PLANT = "Indocement - Grobogan"
const CLIENT_NAME = "Indocement"
const DUMMY_ID_TO_REMOVE = "0864dd11-41bc-46b4-847c-9215bb4a2183"

function parseCleanNumber(val: unknown): string {
  if (val === undefined || val === null || val === "") return "0.00"
  const cleaned = String(val)
    .replace(/Rp/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? "0.00" : num.toFixed(2)
}

interface ParsedIndocementRow {
  no: number
  zoneCode: string
  city: string
  cityCode: string
  destination: string
  ratePerTon: string
  additionalTonnageRate: string
  saving5Percent: string
  deduction2Percent: string
  ljuDeduction: string
  oaDriver: string
  estimatedRevenue: string
  defaultSangu: string
  sanguPercentage: string
  estimatedProfitBase: string
  totalSaving: string
  estimatedProfitTotal: string
}

function parseIndocementCsv(): ParsedIndocementRow[] {
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

  const parsedList: ParsedIndocementRow[] = []

  // Tabel Bawah berada pada baris indeks 36 s/d 60 (25 baris rute)
  for (let i = 0; i < 25; i++) {
    const r = rawRows[i + 36]
    if (!r) continue

    const zoneCode = String(r[2] || "").trim()

    // Standarisasi Penamaan Kota
    let city = String(r[3] || "").trim()
    if (city.toUpperCase() === "SIURABAYA") city = "SURABAYA"
    if (city.toUpperCase() === "BLITAR KABUPATEN") city = "BLITAR"

    const cityCode = String(r[4] || "").trim()

    // Standarisasi Penamaan Tujuan
    let destination = String(r[5] || "").trim()
    if (cityCode === "046109") destination = "Taman / Krian"

    const oaDriver = parseCleanNumber(r[12])
    // Gunakan nilai OA Driver yang memiliki presisi sen untuk ratePerTon agar sinkron dengan perkalian tonase
    const ratePerTon = oaDriver

    const additionalTonnageRate = parseCleanNumber(r[7])
    const saving5Percent = parseCleanNumber(r[9])
    const deduction2Percent = parseCleanNumber(r[10])
    const ljuDeduction = parseCleanNumber(r[11])
    const estimatedRevenue = parseCleanNumber(r[14])
    const defaultSangu = parseCleanNumber(r[15])
    const estimatedProfitBase = parseCleanNumber(r[16])
    const totalSaving = parseCleanNumber(r[17])
    const estimatedProfitTotal = parseCleanNumber(r[18])

    // Hitung persentase sangu presisi (7 desimal) sesuai rumus cell UJ 31 ton
    const sanguNum = parseFloat(defaultSangu)
    const revNum = parseFloat(estimatedRevenue)
    const sanguPercentage =
      revNum > 0 ? (sanguNum / revNum).toFixed(7) : "0.5000000"

    parsedList.push({
      no: i + 1,
      zoneCode,
      city,
      cityCode,
      destination,
      ratePerTon,
      additionalTonnageRate,
      saving5Percent,
      deduction2Percent,
      ljuDeduction,
      oaDriver,
      estimatedRevenue,
      defaultSangu,
      sanguPercentage,
      estimatedProfitBase,
      totalSaving,
      estimatedProfitTotal,
    })
  }

  return parsedList
}

async function runInjection() {
  console.log("=======================================================")
  console.log("🚀 MEMULAI INJEKSI DATA TARIF INDOCEMENT - GROBOGAN")
  console.log("=======================================================\n")

  const routes = parseIndocementCsv()
  console.log(
    `📄 Berhasil membaca ${routes.length} rute Jawa Timur dari Tabel Bawah CSV:`
  )
  console.log(`   Path: ${CSV_PATH}\n`)

  // 1. Bersihkan data dummy manual SIDOARJO - AAA jika ada
  const existingDummy = await db
    .select()
    .from(rateReferences)
    .where(eq(rateReferences.id, DUMMY_ID_TO_REMOVE))

  if (existingDummy.length > 0) {
    console.log(
      `🗑️ Menghapus data dummy manual [${DUMMY_ID_TO_REMOVE}] ${existingDummy[0].city} - ${existingDummy[0].destination}...`
    )
    await db
      .delete(rateReferences)
      .where(eq(rateReferences.id, DUMMY_ID_TO_REMOVE))
    console.log("   ✅ Data dummy berhasil dihapus.\n")
  }

  // 2. Ambil data rute Indocement - Grobogan yang aktif saat ini di database
  const existingIndo = await db
    .select()
    .from(rateReferences)
    .where(eq(rateReferences.originPlant, ORIGIN_PLANT))

  console.log(
    `🔍 Data '${ORIGIN_PLANT}' yang ada di database saat ini: ${existingIndo.length} rute`
  )

  // 3. Kategorikan: Update vs Insert
  const toUpdate: { id: string; row: ParsedIndocementRow; reason: string }[] =
    []
  const toInsert: (typeof rateReferences.$inferInsert)[] = []
  const matchedExistingIds = new Set<string>()

  for (const row of routes) {
    // Cari kecocokan berdasarkan kode tujuan (cityCode) atau kombinasi kota & tujuan
    const dbMatch = existingIndo.find(
      (ext) =>
        (ext.cityCode && ext.cityCode === row.cityCode) ||
        (ext.city.toUpperCase() === row.city.toUpperCase() &&
          ext.destination.toUpperCase() === row.destination.toUpperCase())
    )

    if (dbMatch) {
      matchedExistingIds.add(dbMatch.id)
      toUpdate.push({
        id: dbMatch.id,
        row,
        reason: `Penyelarasan Tarif OA Bawah (${row.ratePerTon}), Sangu (${row.defaultSangu}), dan parameter khusus Indocement`,
      })
    } else {
      toInsert.push({
        originPlant: ORIGIN_PLANT,
        clientName: CLIENT_NAME,
        city: row.city,
        cityCode: row.cityCode,
        zoneCode: row.zoneCode,
        destination: row.destination,
        ratePerTon: row.ratePerTon,
        standardTonnage: "31.00",
        sanguPercentage: row.sanguPercentage,
        defaultSangu: row.defaultSangu,
        additionalTonnageRate: row.additionalTonnageRate,
        saving5Percent: row.saving5Percent,
        deduction2Percent: row.deduction2Percent,
        ljuDeduction: row.ljuDeduction,
        oaDriver: row.oaDriver,
        estimatedRevenue: row.estimatedRevenue,
        estimatedProfitBase: row.estimatedProfitBase,
        totalSaving: row.totalSaving,
        estimatedProfitTotal: row.estimatedProfitTotal,
        hasSpecialDeductions: true,
        isActive: true,
      })
    }
  }

  console.log(`\n📊 Rencana Pemrosesan Data:`)
  console.log(
    `   - Rute di Database yang diperbarui (ID dipertahankan): ${toUpdate.length} rute`
  )
  console.log(
    `   - Rute baru yang akan dimasukkan (INSERT):             ${toInsert.length} rute`
  )
  console.log("")

  // 4. Eksekusi UPDATE pada rute yang sudah ada
  if (toUpdate.length > 0) {
    console.log(
      `🔄 Memperbarui ${toUpdate.length} rute yang sudah ada di database...`
    )
    for (const item of toUpdate) {
      await db
        .update(rateReferences)
        .set({
          city: item.row.city,
          cityCode: item.row.cityCode,
          zoneCode: item.row.zoneCode,
          destination: item.row.destination,
          ratePerTon: item.row.ratePerTon,
          standardTonnage: "31.00",
          sanguPercentage: item.row.sanguPercentage,
          defaultSangu: item.row.defaultSangu,
          additionalTonnageRate: item.row.additionalTonnageRate,
          saving5Percent: item.row.saving5Percent,
          deduction2Percent: item.row.deduction2Percent,
          ljuDeduction: item.row.ljuDeduction,
          oaDriver: item.row.oaDriver,
          estimatedRevenue: item.row.estimatedRevenue,
          estimatedProfitBase: item.row.estimatedProfitBase,
          totalSaving: item.row.totalSaving,
          estimatedProfitTotal: item.row.estimatedProfitTotal,
          hasSpecialDeductions: true,
          clientName: CLIENT_NAME,
        })
        .where(eq(rateReferences.id, item.id))
      console.log(
        `   ✅ Updated [${item.id.slice(0, 8)}...] ${item.row.city} - ${item.row.destination} (${item.reason})`
      )
    }
    console.log("")
  }

  // 5. Eksekusi INSERT pada rute baru
  if (toInsert.length > 0) {
    console.log(`📥 Memasukkan ${toInsert.length} rute baru ke database...`)
    await db.insert(rateReferences).values(toInsert)
    console.log(`   ✅ Berhasil mengunggah ${toInsert.length} rute baru.\n`)
  }

  // 6. Verifikasi hasil akhir di database
  const finalIndo = await db
    .select()
    .from(rateReferences)
    .where(eq(rateReferences.originPlant, ORIGIN_PLANT))

  const totalAllRates = await db.select().from(rateReferences)

  console.log("=======================================================")
  console.log(`🎉 VERIFIKASI AKHIR DATABASE:`)
  console.log(`   Pabrik Asal: ${ORIGIN_PLANT}`)
  console.log(
    `   Total Rute Indocement - Grobogan di Database: ${finalIndo.length} rute`
  )
  console.log(
    `   Total Seluruh Rute (Semua Pabrik): ${totalAllRates.length} rute`
  )
  console.log("=======================================================\n")

  // 7. Sinkronisasi ke db/data/rates.json
  if (fs.existsSync(RATES_JSON_PATH)) {
    console.log("💾 Memperbarui data acuan di db/data/rates.json...")
    const currentRatesJson: (typeof rateReferences.$inferInsert)[] = JSON.parse(
      fs.readFileSync(RATES_JSON_PATH, "utf-8")
    )

    // Filter keluar rute Indocement lama
    const otherRates = currentRatesJson.filter(
      (r) =>
        r.originPlant !== ORIGIN_PLANT &&
        r.clientName !== CLIENT_NAME &&
        r.clientName !== "Indocement Grobogan"
    )

    const updatedIndoRates: (typeof rateReferences.$inferInsert)[] =
      finalIndo.map((r) => ({
        originPlant: ORIGIN_PLANT,
        clientName: CLIENT_NAME,
        city: r.city,
        cityCode: r.cityCode,
        zoneCode: r.zoneCode,
        destination: r.destination,
        ratePerTon: r.ratePerTon,
        standardTonnage: r.standardTonnage,
        sanguPercentage: r.sanguPercentage,
        defaultSangu: r.defaultSangu,
        additionalTonnageRate: r.additionalTonnageRate,
        saving5Percent: r.saving5Percent,
        deduction2Percent: r.deduction2Percent,
        ljuDeduction: r.ljuDeduction,
        oaDriver: r.oaDriver,
        estimatedRevenue: r.estimatedRevenue,
        estimatedProfitBase: r.estimatedProfitBase,
        totalSaving: r.totalSaving,
        estimatedProfitTotal: r.estimatedProfitTotal,
        hasSpecialDeductions: r.hasSpecialDeductions,
        isActive: r.isActive,
      }))

    const newRatesJson = [...otherRates, ...updatedIndoRates]
    fs.writeFileSync(
      RATES_JSON_PATH,
      JSON.stringify(newRatesJson, null, 2),
      "utf-8"
    )
    console.log(
      `   ✅ db/data/rates.json berhasil disinkronkan (${updatedIndoRates.length} rute Indocement, Total: ${newRatesJson.length} rute).\n`
    )
  }

  await pool.end()
}

runInjection().catch((err) => {
  console.error("❌ Terjadi kesalahan saat injeksi Indocement Grobogan:", err)
  pool.end().finally(() => process.exit(1))
})
