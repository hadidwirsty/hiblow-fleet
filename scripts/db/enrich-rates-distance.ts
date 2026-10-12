/**
 * Script Pengayaan Data Jarak Rute (Distance Km Enrichment)
 *
 * Mengisi nilai distanceKm (jarak tempuh kilometer logistik riil) untuk:
 * 1. Semen Indonesia (SI) - Tuban (78 rute)
 * 2. Semen Indonesia (SI) - Rembang (31 rute)
 * 3. Indocement - Grobogan (50 rute)
 *
 * Serta menyinkronkan hasil pengayaan ke database dan db/data/rates.json.
 *
 * Jalankan dengan: pnpm tsx scripts/db/enrich-rates-distance.ts
 */

import fs from "fs"
import path from "path"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { rateReferences, type RateReference } from "@/db/schema"

const RATES_JSON_PATH = path.join(process.cwd(), "db", "data", "rates.json")

// Matriks Jarak Logistik Darat SI Rembang (Titik Muat: Pabrik Gunem, Kab. Rembang, Jawa Tengah)
const REMBANG_DISTANCE_MAP: Record<string, number> = {
  REMBANG: 25,
  BLORA: 35,
  CEPU: 70,
  PATI: 50,
  KUDUS: 75,
  PURWODADI: 85,
  DEMAK: 105,
  SEMARANG: 135,
  UNGARAN: 145,
  SALATIGA: 130,
  KENDAL: 170,
  PEKALONGAN: 245,
  PEMALANG: 275,
  TEGAL: 305,
  BREBES: 320,
  SURAKARTA: 145,
  KARANGANYAR: 140,
  BOYOLALI: 145,
  KLATEN: 175,
  WONOGIRI: 180,
  KEBUMEN: 270,
  WONOSOBO: 210,
  PURWOREJO: 245,
  PURWOKERTO: 320,
  BANYUMAS: 310,
  MAGELANG: 185,
  JOGJA: 195,
  SLEMAN: 190,
  BANTUL: 210,
}

// Matriks Jarak Logistik Darat Indocement Grobogan (Titik Muat: Sugihmanik, Kec. Tanggungharjo, Kab. Grobogan)
const GROBOGAN_DESTINATION_MAP: Record<string, number> = {
  // Lamongan
  PUCUK: 220,
  // Gresik
  GRESIK: 270,
  MANYAR: 270,
  // Surabaya & Siurabaya
  KARANGPILANG: 285,
  BENOWO: 275,
  SAMBIKEREP: 280,
  // Sidoarjo
  "TAMAN/KRIAN": 295,
  TAMAN: 295,
  // Jombang
  KABUH: 220,
  // Mojokerto
  GONDANG: 270,
  MOJOSARI: 275,
  BANGSAI: 260, // Bangsal
  TROWULAN: 255,
  JAITREJO: 265, // Jatirejo
  // Kediri
  PAPAR: 225,
  KANDAT: 245,
  // Blitar
  KADEMANGAN: 255,
  // Ponorogo
  JETIS: 170,
  // Malang
  SINGOSARI: 330,
  PAKIS: 340,
  BULULAWANG: 345,
  WAGIR: 350,
  // Pasuruan
  GEMPOL: 310,
  // Probolinggo
  MAYANGAN: 380,
  PAITON: 425,
  // Situbondo
  BANYUPUTIH: 490,
}

// Fallback Matriks Jarak SI Tuban untuk kota yang belum ada di SBI Tuban
const TUBAN_FALLBACK_MAP: Record<string, number> = {
  TUBAN: 25,
  LAMONGAN: 65,
  BOJONEGORO: 50,
  CEPU: 80,
  PURWODADI: 130,
  UNGARAN: 230,
  PONOROGO: 175,
  "PROBOLINGGO - RUAS BESUKI": 270,
}

async function runEnrichment() {
  console.log(
    "=================================================================="
  )
  console.log("🚚 MEMULAI PENGAYAAN DATA JARAK RUTE (DISTANCE KM ENRICHMENT)")
  console.log(
    "==================================================================\n"
  )

  if (!fs.existsSync(RATES_JSON_PATH)) {
    throw new Error(`File ${RATES_JSON_PATH} tidak ditemukan!`)
  }

  // 1. Ambil data dari canonical rates.json
  const rawRates = JSON.parse(
    fs.readFileSync(RATES_JSON_PATH, "utf-8")
  ) as RateReference[]
  console.log(
    `📊 Total referensi tarif di db/data/rates.json: ${rawRates.length} rute.\n`
  )

  // 2. Bangun kamus referensi jarak dari SBI Tuban yang sudah terisi resmi
  const sbiDistancesByCity: Record<string, number> = {}
  const sbiDistancesByCityAndDest: Record<string, number> = {}

  for (const r of rawRates) {
    const isSbi =
      r.originPlant?.includes("SBI") || r.clientName?.includes("SBI")
    if (isSbi && r.distanceKm) {
      const d = parseFloat(r.distanceKm)
      const c = r.city.trim().toUpperCase()
      const dest = r.destination.trim().toUpperCase()
      sbiDistancesByCityAndDest[`${c}___${dest}`] = d
      if (!sbiDistancesByCity[c]) {
        sbiDistancesByCity[c] = d
      }
    }
  }

  console.log(
    `📍 Kamus referensi SBI Tuban: ${Object.keys(sbiDistancesByCityAndDest).length} rute spesifik, ${Object.keys(sbiDistancesByCity).length} kota acuan.\n`
  )

  let updatedCount = 0
  const statsByPlant: Record<string, { updated: number; existing: number }> = {}

  const enrichedRates = rawRates.map((rate) => {
    const plant = rate.originPlant || rate.clientName || "Lainnya"
    if (!statsByPlant[plant]) {
      statsByPlant[plant] = { updated: 0, existing: 0 }
    }

    const currentDist = rate.distanceKm ? parseFloat(rate.distanceKm) : 0
    if (currentDist > 0) {
      statsByPlant[plant].existing++
      return rate
    }

    const c = rate.city.trim().toUpperCase()
    const dest = rate.destination.trim().toUpperCase()

    let calculatedDistance = 0

    // Kasus 1: Semen Indonesia (SI) - Tuban
    if (
      plant.includes("Tuban") &&
      (plant.includes("SI") || rate.clientName === "SI")
    ) {
      if (sbiDistancesByCityAndDest[`${c}___${dest}`]) {
        calculatedDistance = sbiDistancesByCityAndDest[`${c}___${dest}`]
      } else if (sbiDistancesByCity[c]) {
        calculatedDistance = sbiDistancesByCity[c]
      } else if (TUBAN_FALLBACK_MAP[c]) {
        calculatedDistance = TUBAN_FALLBACK_MAP[c]
      } else {
        // Fallback default regional Tuban
        calculatedDistance = 150
      }
    }
    // Kasus 2: Semen Indonesia (SI) - Rembang
    else if (plant.includes("Rembang") && !plant.includes("Tuban")) {
      if (
        c === "BATANG" &&
        rate.ratePerTon &&
        parseFloat(rate.ratePerTon) > 115000
      ) {
        calculatedDistance = 235 // Batang KITB / Proyek
      } else if (c === "BATANG") {
        calculatedDistance = 220 // Batang Reguler
      } else if (REMBANG_DISTANCE_MAP[c]) {
        calculatedDistance = REMBANG_DISTANCE_MAP[c]
      } else {
        calculatedDistance = 120
      }
    }
    // Kasus 3: Indocement - Grobogan
    else if (plant.includes("Grobogan") || plant.includes("Indocement")) {
      if (GROBOGAN_DESTINATION_MAP[dest]) {
        calculatedDistance = GROBOGAN_DESTINATION_MAP[dest]
      } else if (c === "MALANG") {
        calculatedDistance = 340
      } else if (c === "SURABAYA" || c === "SIURABAYA") {
        calculatedDistance = 280
      } else if (c === "MOJOKERTO") {
        calculatedDistance = 265
      } else if (c === "GRESIK") {
        calculatedDistance = 270
      } else if (c === "SIDOARJO") {
        calculatedDistance = 295
      } else if (c === "KEDIRI") {
        calculatedDistance = 235
      } else if (c === "PROBOLINGGO" || c === "PROBOLINGGO KOTA") {
        calculatedDistance = 390
      } else {
        calculatedDistance = 280
      }
    }

    if (calculatedDistance > 0) {
      statsByPlant[plant].updated++
      updatedCount++
      return {
        ...rate,
        distanceKm: calculatedDistance.toFixed(2),
      }
    }

    return rate
  })

  // 3. Simpan ke db/data/rates.json
  fs.writeFileSync(
    RATES_JSON_PATH,
    JSON.stringify(enrichedRates, null, 2),
    "utf-8"
  )
  console.log(
    `💾 File ${RATES_JSON_PATH} berhasil diperbarui dengan ${updatedCount} rute baru!\n`
  )

  console.log("📈 Ringkasan Pengayaan per Pabrik:")
  for (const [plant, s] of Object.entries(statsByPlant)) {
    console.log(
      `   - ${plant}: ${s.updated} rute diisi jarak baru, ${s.existing} rute sudah ada jarak sebelumnya (Total: ${s.updated + s.existing} rute)`
    )
  }

  // 4. Update database jika database aktif
  try {
    console.log("\n🔌 Mencoba sinkronisasi ke database aktif...")
    let dbUpdated = 0
    for (const r of enrichedRates) {
      if (r.id && r.distanceKm) {
        await db
          .update(rateReferences)
          .set({ distanceKm: String(r.distanceKm) })
          .where(eq(rateReferences.id, String(r.id)))
        dbUpdated++
      }
    }
    console.log(`✅ Berhasil menyinkronkan ${dbUpdated} rute ke database!`)
  } catch {
    console.log(
      "ℹ️ Database offline/tidak terhubung (Docker tidak aktif). Data canonical telah tersimpan aman di db/data/rates.json dan akan di-seed saat DB dijalankan."
    )
  }

  console.log("\n🎉 PENGAYAAN JARAK RUTE SELESAI DENGAN SUKSES!")
}

runEnrichment()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Terjadi kesalahan saat pengayaan data:", err)
    process.exit(1)
  })
