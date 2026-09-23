import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"
import * as XLSX from "xlsx"

dotenv.config({ path: ".env.local" })

import { db, pool } from "@/db"
import {
  expenses,
  profitShares,
  profitSharingPeriods,
  rateReferences,
  trips,
  trucks,
} from "@/db/schema"

const csvDir = path.resolve("./docs/csv")
const historyJsonPath = path.resolve("./db/data/history.json")
const ratesJsonPath = path.resolve("./db/data/rates.json")

function parseIndoDate(dateStr: unknown): string | null {
  if (!dateStr) return null
  const s = String(dateStr).trim()
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  const months: Record<string, string> = {
    januari: "01",
    jan: "01",
    februari: "02",
    feb: "02",
    maret: "03",
    mar: "03",
    april: "04",
    apr: "04",
    mei: "05",
    juni: "06",
    jun: "06",
    juli: "07",
    jul: "07",
    agustus: "08",
    agu: "08",
    agt: "08",
    september: "09",
    sep: "09",
    oktober: "10",
    okt: "10",
    november: "11",
    nov: "11",
    desember: "12",
    des: "12",
  }

  const clean = s.replace(/^[a-zA-Z'’]+,\s*/, "").trim()
  const parts = clean.split(/\s+/)
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, "0")
    const monthName = parts[1].toLowerCase()
    const month = months[monthName] || "01"
    const year = parts[2]
    return `${year}-${month}-${day}`
  }
  return null
}

function parseMoney(val: unknown): string {
  if (val === undefined || val === null || val === "") return "0.00"
  let s = String(val)
    .trim()
    .replace(/[^\d,\.-]/g, "")
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(/,/g, ".")
  } else if (s.includes(",")) {
    s = s.replace(/,/g, ".")
  } else if (s.includes(".")) {
    const parts = s.split(".")
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      s = s.replace(/\./g, "")
    }
  }
  const n = parseFloat(s)
  return isNaN(n) ? "0.00" : n.toFixed(2)
}

function parseTonnage(val: unknown): string {
  if (!val) return "0.00"
  let s = String(val)
    .trim()
    .replace(/[^\d,\.-]/g, "")
  if (s.includes(",")) {
    s = s.replace(/,/g, ".")
  }
  let n = parseFloat(s)
  if (isNaN(n)) return "0.00"
  if (n > 100) {
    n = n / 100
  }
  return n.toFixed(2)
}

function parseTarif(val: unknown): string {
  if (!val) return "0.00"
  let s = String(val)
    .trim()
    .replace(/[^\d,\.-]/g, "")
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(/,/g, ".")
  } else if (s.includes(",")) {
    s = s.replace(/,/g, ".")
  } else if (s.includes(".")) {
    const parts = s.split(".")
    if (parts.length === 2 && parts[1].length === 3) {
      s = s.replace(/\./g, "")
    } else if (parts.length === 2 && parts[1].length === 2) {
      s = s.replace(/\./g, "") + "0"
    } else if (parts.length === 2 && parts[1].length === 1) {
      s = s.replace(/\./g, "") + "00"
    }
  }
  const n = parseFloat(s)
  return isNaN(n) ? "0.00" : n.toFixed(2)
}

function categorizeExpense(desc: string): string {
  const d = desc.toLowerCase()
  if (
    d.includes("servis") ||
    d.includes("mekanik") ||
    d.includes("cek") ||
    d.includes("pasang") ||
    d.includes("baut") ||
    d.includes("stel") ||
    d.includes("las") ||
    d.includes("turun mesin") ||
    d.includes("cuci") ||
    d.includes("semprot") ||
    d.includes("tambal") ||
    d.includes("kontrol ban")
  ) {
    return "Servis"
  }
  if (
    d.includes("dp") ||
    d.includes("cicilan") ||
    d.includes("pembayaran truk")
  ) {
    return "DP/Cicilan"
  }
  if (d.includes("gps")) {
    return "GPS"
  }
  if (d.includes("solar") || d.includes("bbm") || d.includes("uj kosongan")) {
    return "BBM"
  }
  if (
    d.includes("stnk") ||
    d.includes("uji") ||
    d.includes("kir") ||
    d.includes("pajak") ||
    d.includes("jasa lain")
  ) {
    return "Administrasi"
  }
  if (
    d.includes("ban") ||
    d.includes("selang") ||
    d.includes("aki") ||
    d.includes("valve") ||
    d.includes("filter") ||
    d.includes("oli") ||
    d.includes("kabel") ||
    d.includes("joint") ||
    d.includes("meditran") ||
    d.includes("hcl") ||
    d.includes("couple") ||
    d.includes("lampu") ||
    d.includes("marset")
  ) {
    return "Onderdil"
  }
  return "Lainnya"
}

function parseTripsFromCSV(fileName: string, truckId: string) {
  const wb = XLSX.read(fs.readFileSync(path.join(csvDir, fileName), "utf-8"), {
    type: "string",
    raw: true,
  })
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(
    wb.Sheets[wb.SheetNames[0]],
    {
      header: 1,
      raw: true,
    }
  )
  const tripRows = rows.filter(
    (r) => r[0] !== undefined && !isNaN(Number(r[0])) && Number(r[0]) > 0
  )

  return tripRows.map((r) => {
    const orderNumber = String(r[0])
    const orderDate = parseIndoDate(r[1]) || "2026-08-01"
    const unloadingDate = parseIndoDate(r[2])
    const destinationCity = String(r[3] || "").trim()
    const destinationName = String(r[4] || "").trim()
    const ratePerTon = parseTarif(r[5])
    const loadedTonnage = r[6] ? parseTonnage(r[6]) : null
    const unloadedTonnage = parseTonnage(r[7])
    const omset = parseMoney(r[8])
    const sangu = parseMoney(r[12])
    const profit = parseMoney(r[13])
    const incentiveRate = r[19] ? parseMoney(r[19]) : "0.00"
    const incentivePaid = r[20] ? parseMoney(r[20]) : "0.00"
    const thirdPartyFee = r[26] ? parseMoney(r[26]) : "100000.00"
    const thirdPartyStatus = r[27] ? String(r[27]).trim() : "Disimpan"
    const notes = r[30] ? String(r[30]).trim() : null

    return {
      truckId,
      orderNumber,
      orderDate,
      unloadingDate,
      destinationCity,
      destinationName,
      ratePerTon,
      loadedTonnage,
      unloadedTonnage,
      omset,
      sangu,
      incentiveRate,
      incentivePaid,
      incentiveStatus: "Disimpan",
      thirdPartyFee,
      thirdPartyName: "Mas Mawan (CV. Satria Perwira)",
      thirdPartyStatus,
      tax1Pct: (parseFloat(omset) * 0.01).toFixed(2),
      deduction2PctLju: "0.00",
      deduction5PctUjGrb: "0.00",
      mealAllowance: "0.00",
      savings: "0.00",
      claim: "0.00",
      claimDriver: "0.00",
      profit,
      notes,
    }
  })
}

function parseExpensesFromCSV(fileName: string, truckId: string) {
  const wb = XLSX.read(fs.readFileSync(path.join(csvDir, fileName), "utf-8"), {
    type: "string",
    raw: true,
  })
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(
    wb.Sheets[wb.SheetNames[0]],
    {
      header: 1,
      raw: true,
    }
  )
  let currentDate: string | null = null
  const list = []

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i]
    if (!r) continue
    if (r[3] && String(r[3]).toLowerCase() === "total") break
    if (r[2] && String(r[2]).toLowerCase() === "total") break
    if (
      r[3] &&
      (String(r[3]).toLowerCase().includes("truk") ||
        String(r[3]).toLowerCase().includes("stnk"))
    )
      break

    if (r[1]) {
      const d = parseIndoDate(r[1])
      if (d) currentDate = d
    }

    const desc = r[2] ? String(r[2]).trim() : ""
    const nominal = parseMoney(r[4])
    const adminFee = parseMoney(r[5])
    const loc = r[6] ? String(r[6]).trim() : null
    const notes = r[7] ? String(r[7]).trim() : null

    if (desc && parseFloat(nominal) > 0) {
      list.push({
        truckId,
        expenseDate: currentDate || "2025-06-01",
        category: categorizeExpense(desc),
        description: desc,
        amount: nominal,
        adminFee,
        location: loc,
        repairNotes: notes,
      })
    }
  }
  return list
}

export async function runSync() {
  console.log("==========================================")
  console.log("🔄 MEMULAI SINKRONISASI DATA SPREADSHEET CSV")
  console.log("==========================================\n")

  // ----------------------------------------------------
  // 1. TRIPS SINKRONISASI DARI CSV
  // ----------------------------------------------------
  console.log(
    "📦 1. Mem-parse seluruh Trip dari CSV Masuk W8187UA & H8133OF..."
  )
  const tripsW = parseTripsFromCSV(
    "PERHITUNGAN HIBLOW HW Trans.xlsx - Masuk W8187UA.csv",
    "W8187UA"
  )
  const tripsH = parseTripsFromCSV(
    "PERHITUNGAN HIBLOW HW Trans.xlsx - Masuk H8133OF.csv",
    "H8133OF"
  )
  const allTrips = [...tripsW, ...tripsH]
  console.log(
    `  ✅ W8187UA Trips: ${tripsW.length} trips (Order 1 s/d ${tripsW[tripsW.length - 1].orderNumber})`
  )
  console.log(
    `  ✅ H8133OF Trips: ${tripsH.length} trips (Order 1 s/d ${tripsH[tripsH.length - 1].orderNumber})`
  )
  console.log(`  ✅ Total Ritase (Trips): ${allTrips.length} trips\n`)

  // ----------------------------------------------------
  // 2. EXPENSES SINKRONISASI DARI CSV
  // ----------------------------------------------------
  console.log(
    "🧾 2. Mem-parse seluruh Pengeluaran dari CSV Keluar W8187UA & H8133OF..."
  )
  const expW = parseExpensesFromCSV(
    "PERHITUNGAN HIBLOW HW Trans.xlsx - Keluar W8187UA.csv",
    "W8187UA"
  )
  const expH = parseExpensesFromCSV(
    "PERHITUNGAN HIBLOW HW Trans.xlsx - Keluar H8133OF.csv",
    "H8133OF"
  )
  const allExpenses = [...expW, ...expH]
  console.log(`  ✅ W8187UA Expenses: ${expW.length} pengeluaran`)
  console.log(`  ✅ H8133OF Expenses: ${expH.length} pengeluaran`)
  console.log(
    `  ✅ Total Pengeluaran (Expenses): ${allExpenses.length} transaksi\n`
  )

  // ----------------------------------------------------
  // 3. BAGI HASIL REVISI
  // ----------------------------------------------------
  console.log(
    "📊 3. Memperbarui Periode Bagi Hasil (Termasuk Revisi September 2025)..."
  )
  const profitSharingPeriodsData = [
    {
      title: "Bagi Hasil 25 Jul - 31 Agu 2025",
      startDate: "2025-07-25",
      endDate: "2025-08-31",
      totalIncome: "25600611.51",
      totalExpenses: "8496400.00",
      grossBalance: "17104211.51",
      managerCommissionRate: "0.0500",
      managerCommissionAmount: "500000.00",
      distributableProfit: "16604211.51",
      fleetValuation: "580000000.00",
      managerProfit: "13741416.42",
      managerTakeHome: "14241416.42",
      status: "finalized",
      shares: [
        {
          partnerName: "Alfiah",
          capitalShare: "50000000.00",
          sharePercentage: "0.086207",
          payoutAmount: "1431397.54",
          notes: "50jt / 580jt Deal",
        },
      ],
    },
    {
      title: "Bagi Hasil 1 - 30 Sep 2025 (Revisi)",
      startDate: "2025-09-01",
      endDate: "2025-09-30",
      totalIncome: "23358816.41",
      totalExpenses: "7551152.00",
      grossBalance: "15807664.41",
      managerCommissionRate: "0.0500",
      managerCommissionAmount: "790383.22",
      distributableProfit: "15017281.19",
      fleetValuation: "580000000.00",
      managerProfit: "11760243.30",
      managerTakeHome: "12550626.52",
      status: "finalized",
      shares: [
        {
          partnerName: "Alfiah",
          capitalShare: "50000000.00",
          sharePercentage: "0.086207",
          payoutAmount: "1294593.21",
          notes: "50jt / 580jt (Revisi)",
        },
        {
          partnerName: "Mas Dhian",
          capitalShare: "75000000.00",
          sharePercentage: "0.129310",
          payoutAmount: "1941889.81",
          notes: "75jt / 580jt (Revisi)",
        },
      ],
    },
  ]
  console.log(
    "  ✅ Periode Bagi Hasil siap dengan 2 periode final (Agustus 2025 & September 2025 Revisi).\n"
  )

  // ----------------------------------------------------
  // 4. RATES (SI REMBANG)
  // ----------------------------------------------------
  console.log("🗺️ 4. Menambahkan 31 Rute Baru Pabrik SI Rembang...")
  const rates = JSON.parse(fs.readFileSync(ratesJsonPath, "utf-8"))
  const fileRembang = "PERHITUNGAN HIBLOW HW Trans.xlsx - SI Rembang.csv"
  const wbRembang = XLSX.read(
    fs.readFileSync(path.join(csvDir, fileRembang), "utf-8"),
    { type: "string", raw: true }
  )
  const rowsRembang = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(
    wbRembang.Sheets[wbRembang.SheetNames[0]],
    { header: 1, raw: true }
  )

  let addedRates = 0
  for (let i = 1; i < rowsRembang.length; i++) {
    const r = rowsRembang[i]
    if (!r || !r[1]) continue
    const city = String(r[1]).trim()
    const destination = r[2] ? String(r[2]).trim() : `SI REMBANG - ${city}`
    const ratePerTon = parseTarif(r[3])
    const standardTonnage = parseTonnage(r[4]) || "31.00"
    const additionalTonnageRate = parseTarif(r[8]) || "25000.00"

    const exists = rates.some(
      (rt: { clientName: string; city: string }) =>
        rt.clientName === "SI Rembang" &&
        rt.city.toLowerCase() === city.toLowerCase()
    )
    if (!exists) {
      const sTonnage = parseFloat(standardTonnage) || 31
      const rPerTon = parseFloat(ratePerTon) || 0
      const dSangu = (
        Math.round((rPerTon * sTonnage * 0.5) / 1000) * 1000
      ).toFixed(2)

      rates.push({
        originPlant: "Semen Indonesia (SI) - Rembang",
        clientName: "SI Rembang",
        city,
        destination,
        ratePerTon,
        standardTonnage,
        sanguPercentage: "0.5000",
        defaultSangu: dSangu,
        additionalTonnageRate,
        hasSpecialDeductions: false,
        isActive: true,
      })
      addedRates++
    }
  }
  console.log(
    `  ✅ Total Referensi Tarif: ${rates.length} (+${addedRates} rute SI Rembang)\n`
  )

  // ----------------------------------------------------
  // 5. SIMPAN KE FILE JSON LOKAL
  // ----------------------------------------------------
  const historyData = {
    trips: allTrips,
    expenses: allExpenses,
    profitSharingPeriods: profitSharingPeriodsData,
  }

  fs.writeFileSync(
    historyJsonPath,
    JSON.stringify(historyData, null, 2),
    "utf-8"
  )
  fs.writeFileSync(ratesJsonPath, JSON.stringify(rates, null, 2), "utf-8")
  console.log(
    "💾 Berhasil menyimpan data canonical ke db/data/history.json & db/data/rates.json!\n"
  )

  // ----------------------------------------------------
  // 6. SYNC KE DATABASE NEON / POSTGRES
  // ----------------------------------------------------
  console.log("🚀 6. Menyinkronkan ke Database PostgreSQL/Neon Cloud...")

  // 6.1 Ensure trucks
  await db
    .insert(trucks)
    .values([
      {
        id: "W8187UA",
        plateNumber: "W 8187 UA",
        brandModel: "Hino 500 Tronton Hi-Blow",
        isActive: true,
      },
      {
        id: "H8133OF",
        plateNumber: "H 8133 OF",
        brandModel: "Hino 500 Tronton Hi-Blow",
        isActive: true,
      },
    ])
    .onConflictDoNothing()
  console.log("  🚛 Armada Truk (W8187UA, H8133OF) terverifikasi.")

  // 6.2 Rate references
  console.log(`  🔄 Mengunggah ${rates.length} referensi tarif...`)
  for (let i = 0; i < rates.length; i += 50) {
    const batch = rates.slice(i, i + 50)
    await db.insert(rateReferences).values(batch).onConflictDoNothing()
  }

  // 6.3 Clear and re-populate transactional tables
  console.log(
    "  🧹 Resetting tabel transaksional (trips, expenses, profit_shares, profit_sharing_periods)..."
  )
  await db.delete(profitShares)
  await db.delete(profitSharingPeriods)
  await db.delete(expenses)
  await db.delete(trips)

  // 6.4 Insert trips in batches
  console.log(`  📦 Mengunggah ${allTrips.length} trips...`)
  for (let i = 0; i < allTrips.length; i += 50) {
    const batch = allTrips.slice(i, i + 50)
    await db.insert(trips).values(batch)
  }

  // 6.5 Insert expenses in batches
  console.log(`  🧾 Mengunggah ${allExpenses.length} expenses...`)
  for (let i = 0; i < allExpenses.length; i += 50) {
    const batch = allExpenses.slice(i, i + 50)
    await db.insert(expenses).values(batch)
  }

  // 6.6 Insert profit sharing
  console.log(
    `  📊 Mengunggah ${profitSharingPeriodsData.length} profit sharing periods...`
  )
  for (const period of profitSharingPeriodsData) {
    const [insertedPeriod] = await db
      .insert(profitSharingPeriods)
      .values({
        title: period.title,
        startDate: period.startDate,
        endDate: period.endDate,
        totalIncome: period.totalIncome,
        totalExpenses: period.totalExpenses,
        grossBalance: period.grossBalance,
        managerCommissionRate: period.managerCommissionRate,
        managerCommissionAmount: period.managerCommissionAmount,
        distributableProfit: period.distributableProfit,
        fleetValuation: period.fleetValuation,
        managerProfit: period.managerProfit,
        managerTakeHome: period.managerTakeHome,
        status: period.status,
      })
      .returning({ id: profitSharingPeriods.id })

    if (period.shares && period.shares.length > 0) {
      interface PeriodShareData {
        partnerName: string
        capitalShare: string
        sharePercentage: string
        payoutAmount: string
        notes?: string | null
      }
      await db.insert(profitShares).values(
        period.shares.map((s: PeriodShareData) => ({
          periodId: insertedPeriod.id,
          partnerName: s.partnerName,
          capitalShare: s.capitalShare,
          sharePercentage: s.sharePercentage,
          payoutAmount: s.payoutAmount,
          notes: s.notes,
        }))
      )
    }
  }

  console.log("\n==========================================")
  console.log("🎉 SINKRONISASI DATABASE NEON 100% SUKSES!")
  console.log(
    `🚛 Total Trips: ${allTrips.length} (W8187UA: ${tripsW.length}, H8133OF: ${tripsH.length})`
  )
  console.log(
    `🧾 Total Expenses: ${allExpenses.length} (W8187UA: ${expW.length}, H8133OF: ${expH.length})`
  )
  console.log(`🗺️ Referensi Tarif: ${rates.length}`)
  console.log(`📊 Periode Bagi Hasil: ${profitSharingPeriodsData.length}`)
  console.log("==========================================\n")

  await pool.end()
}

runSync().catch((err) => {
  console.error("❌ Sync Error:", err)
  pool.end().finally(() => process.exit(1))
})
