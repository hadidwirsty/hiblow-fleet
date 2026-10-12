import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

import { db, pool } from "@/db"
import { rateReferences } from "@/db/schema"
import { eq } from "drizzle-orm"

const CSV_PATH = path.resolve(
  "./docs/csv/PERHITUNGAN HIBLOW HW Trans.xlsx - Semen Indonesia (SI) - Rembang.csv"
)
const RATES_JSON_PATH = path.resolve("./db/data/rates.json")

const ORIGIN_PLANT = "Semen Indonesia (SI) - Rembang"
const CLIENT_NAME = "Semen Indonesia - Rembang"

function parseCleanNumber(val: string | undefined): string {
  if (!val) return "0.00"
  const cleaned = val.trim().replace(/\./g, "").replace(/,/g, ".")
  const num = parseFloat(cleaned)
  return isNaN(num) ? "0.00" : num.toFixed(2)
}

interface CsvRowData {
  no: number
  city: string
  destination: string
  ratePerTon: string
  standardTonnage: string
  defaultSangu: string
  additionalTonnageRate: string
}

function parseCsvFile(): CsvRowData[] {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`File CSV tidak ditemukan pada path: ${CSV_PATH}`)
  }

  const rawContent = fs.readFileSync(CSV_PATH, "utf-8")
  const lines = rawContent
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  // Baris pertama adalah header
  const dataLines = lines.slice(1)
  const rows: CsvRowData[] = []

  for (const line of dataLines) {
    const parts = line.split(",")
    const rawNo = parts[0]?.trim()
    const no = parseInt(rawNo || "0", 10)
    if (isNaN(no) || no <= 0) continue

    const city = parts[1]?.trim() ?? ""
    const rawDest = parts[2]?.trim() ?? ""
    const destination = rawDest || city
    const ratePerTon = parseCleanNumber(parts[3])
    const standardTonnage = parseCleanNumber(parts[4]) || "31.00"
    const defaultSangu = parseCleanNumber(parts[6])
    const additionalTonnageRate = parseCleanNumber(parts[8]) || "25000.00"

    rows.push({
      no,
      city,
      destination,
      ratePerTon,
      standardTonnage,
      defaultSangu,
      additionalTonnageRate,
    })
  }

  return rows
}

async function runInjection() {
  console.log("=======================================================")
  console.log("🚀 MEMULAI INJEKSI DATA TARIF SI REMBANG KE DATABASE")
  console.log("=======================================================\n")

  const csvRows = parseCsvFile()
  console.log(`📄 Berhasil membaca ${csvRows.length} baris data dari CSV:`)
  console.log(`   Path: ${CSV_PATH}\n`)

  // 1. Ambil data rute SI Rembang yang sudah ada di database
  const existingRembang = await db
    .select()
    .from(rateReferences)
    .where(eq(rateReferences.originPlant, ORIGIN_PLANT))

  console.log(
    `🔍 Data '${ORIGIN_PLANT}' yang sudah ada di database: ${existingRembang.length} rute`
  )
  for (const ext of existingRembang) {
    console.log(
      `   - [ID: ${ext.id}] ${ext.city} | Tarif: Rp${parseFloat(ext.ratePerTon).toLocaleString("id-ID")} | Sangu: Rp${parseFloat(ext.defaultSangu || "0").toLocaleString("id-ID")}`
    )
  }
  console.log("")

  // 2. Filter data baru yang belum ada di database
  const rowsToInsert: (typeof rateReferences.$inferInsert)[] = []
  const skippedRows: CsvRowData[] = []

  for (const row of csvRows) {
    // Cek apakah data ini sudah ada berdasarkan originPlant, city, ratePerTon, standardTonnage
    const alreadyExists = existingRembang.some(
      (ext) =>
        ext.city.toUpperCase() === row.city.toUpperCase() &&
        parseFloat(ext.ratePerTon) === parseFloat(row.ratePerTon) &&
        parseFloat(ext.standardTonnage) === parseFloat(row.standardTonnage)
    )

    if (alreadyExists) {
      skippedRows.push(row)
    } else {
      rowsToInsert.push({
        originPlant: ORIGIN_PLANT,
        clientName: CLIENT_NAME,
        city: row.city,
        destination: row.destination,
        ratePerTon: row.ratePerTon,
        standardTonnage: row.standardTonnage,
        sanguPercentage: "0.5000000",
        defaultSangu: row.defaultSangu,
        additionalTonnageRate: row.additionalTonnageRate,
        hasSpecialDeductions: false,
        isActive: true,
      })
    }
  }

  console.log(
    `⏭️  Dilewati (Sudah ada di database): ${skippedRows.length} rute:`
  )
  for (const s of skippedRows) {
    console.log(
      `   - No.${s.no} ${s.city} (Rp${parseFloat(s.ratePerTon).toLocaleString("id-ID")})`
    )
  }
  console.log("")

  console.log(`📥 Rute baru yang akan diinjeksi: ${rowsToInsert.length} rute`)

  if (rowsToInsert.length > 0) {
    console.log("⏳ Mengunggah rute baru ke database...")
    const inserted = await db
      .insert(rateReferences)
      .values(rowsToInsert)
      .returning()
    console.log(
      `✅ Berhasil menginjeksi ${inserted.length} rute baru ke database!\n`
    )
  } else {
    console.log("ℹ️ Tidak ada rute baru yang perlu diinjeksi.\n")
  }

  // 3. Sinkronisasi data ke canonical rates.json
  if (fs.existsSync(RATES_JSON_PATH)) {
    console.log("💾 Memperbarui data acuan di db/data/rates.json...")
    const currentRatesJson: (typeof rateReferences.$inferInsert)[] = JSON.parse(
      fs.readFileSync(RATES_JSON_PATH, "utf-8")
    )

    // Hapus entri lama SI Rembang di rates.json jika formatnya belum canonical
    const otherRates = currentRatesJson.filter(
      (r) =>
        r.originPlant !== ORIGIN_PLANT &&
        r.clientName !== CLIENT_NAME &&
        r.clientName !== "SI Rembang"
    )

    const updatedRembangRates: (typeof rateReferences.$inferInsert)[] =
      csvRows.map((row) => ({
        originPlant: ORIGIN_PLANT,
        clientName: CLIENT_NAME,
        city: row.city,
        destination: row.destination,
        ratePerTon: row.ratePerTon,
        standardTonnage: row.standardTonnage,
        sanguPercentage: "0.5000000",
        defaultSangu: row.defaultSangu,
        additionalTonnageRate: row.additionalTonnageRate,
        hasSpecialDeductions: false,
        isActive: true,
      }))

    const newRatesJson = [...otherRates, ...updatedRembangRates]
    fs.writeFileSync(
      RATES_JSON_PATH,
      JSON.stringify(newRatesJson, null, 2),
      "utf-8"
    )
    console.log(
      `   ✅ db/data/rates.json berhasil diperbarui dengan ${updatedRembangRates.length} rute SI Rembang (Total: ${newRatesJson.length} rute).\n`
    )
  }

  // 4. Verifikasi akhir dari database
  const finalRembang = await db
    .select()
    .from(rateReferences)
    .where(eq(rateReferences.originPlant, ORIGIN_PLANT))

  console.log("=======================================================")
  console.log(`🎉 VERIFIKASI AKHIR DATABASE:`)
  console.log(`   Pabrik Asal: ${ORIGIN_PLANT}`)
  console.log(`   Klien: ${CLIENT_NAME}`)
  console.log(`   Total Rute di Database: ${finalRembang.length} / 31 rute`)
  console.log("=======================================================\n")

  console.log("Daftar seluruh rute SI Rembang di Database saat ini:")
  finalRembang
    .sort((a, b) => a.city.localeCompare(b.city))
    .forEach((r, idx) => {
      console.log(
        `   ${(idx + 1).toString().padStart(2, " ")}. Kota: ${r.city.padEnd(14, " ")} | Dest: ${r.destination.padEnd(14, " ")} | Tarif: Rp${parseFloat(r.ratePerTon).toLocaleString("id-ID").padStart(8, " ")} | Ton: ${parseFloat(r.standardTonnage)}t | Sangu: Rp${parseFloat(
          r.defaultSangu || "0"
        )
          .toLocaleString("id-ID")
          .padStart(
            10,
            " "
          )} | +Ton: Rp${parseFloat(r.additionalTonnageRate).toLocaleString("id-ID").padStart(7, " ")}`
      )
    })

  await pool.end()
}

runInjection().catch((err) => {
  console.error("❌ Terjadi kesalahan saat injeksi:", err)
  pool.end().finally(() => process.exit(1))
})
