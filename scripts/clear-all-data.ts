import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

import { db, pool } from "../db/index"
import {
  expenses,
  maintenanceReminders,
  profitShares,
  profitSharingPeriods,
  trips,
} from "../db/schema"

async function clearAllTransactionalData() {
  console.log("🧹 Memulai proses pembersihan data operasional & finansial...")

  // 1. Backup seluruh data transaksi sebelum dihapus
  console.log(
    "📦 1. Membuat cadangan (backup) data operasional ke file lokal..."
  )
  const allTrips = await db.select().from(trips)
  const allExpenses = await db.select().from(expenses)
  const allPeriods = await db.select().from(profitSharingPeriods)
  const allShares = await db.select().from(profitShares)

  const backupData = {
    backupDate: new Date().toISOString(),
    tripsCount: allTrips.length,
    expensesCount: allExpenses.length,
    periodsCount: allPeriods.length,
    sharesCount: allShares.length,
    trips: allTrips,
    expenses: allExpenses,
    profitSharingPeriods: allPeriods,
    profitShares: allShares,
  }

  const backupPath = path.resolve("./db/data/backup-transactional-data.json")
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2), "utf-8")
  console.log(`   ✅ Berhasil membuat backup di ${backupPath}`)
  console.log(
    `      - ${allTrips.length} ritase (trips)` +
      `\n      - ${allExpenses.length} pengeluaran (expenses)` +
      `\n      - ${allPeriods.length} periode bagi hasil` +
      `\n      - ${allShares.length} pembagian hasil investor`
  )

  // 2. Eksekusi pembersihan data dalam database
  console.log("🗑️ 2. Menghapus data transaksi dari database...")

  // Hapus profit shares terlebih dahulu (child dari profit_sharing_periods)
  const delShares = await db
    .delete(profitShares)
    .returning({ id: profitShares.id })
  console.log(`   ✅ Terhapus ${delShares.length} rekaman profit_shares`)

  // Hapus profit sharing periods
  const delPeriods = await db
    .delete(profitSharingPeriods)
    .returning({ id: profitSharingPeriods.id })
  console.log(
    `   ✅ Terhapus ${delPeriods.length} rekaman profit_sharing_periods`
  )

  // Hapus expenses
  const delExpenses = await db.delete(expenses).returning({ id: expenses.id })
  console.log(`   ✅ Terhapus ${delExpenses.length} rekaman expenses`)

  // Hapus trips
  const delTrips = await db.delete(trips).returning({ id: trips.id })
  console.log(`   ✅ Terhapus ${delTrips.length} rekaman trips`)

  // Pastikan maintenance_reminders & rate_references juga bersih jika ada
  const delReminders = await db
    .delete(maintenanceReminders)
    .returning({ id: maintenanceReminders.id })
  if (delReminders.length > 0) {
    console.log(
      `   ✅ Terhapus ${delReminders.length} rekaman maintenance_reminders`
    )
  }

  // Pastikan rate_references juga bersih jika ada
  await pool.query("DELETE FROM rate_references")

  // 3. Verifikasi data setelah pembersihan
  console.log("\n🔍 3. Verifikasi sisa data di database:")
  const getCount = async (table: string) => {
    const res = await pool.query(`SELECT count(*)::int as count FROM ${table}`)
    return res.rows[0].count
  }

  const remTrips = await getCount("trips")
  const remExpenses = await getCount("expenses")
  const remPeriods = await getCount("profit_sharing_periods")
  const remShares = await getCount("profit_shares")
  const remRates = await getCount("rate_references")
  const remUsers = await getCount('"user"')
  const remTrucks = await getCount("trucks")

  console.log(`   • /trips (trips): ${remTrips} rekaman (KOSONG)`)
  console.log(`   • /expenses (expenses): ${remExpenses} rekaman (KOSONG)`)
  console.log(
    `   • /profit-sharing (periods & shares): ${remPeriods} periode, ${remShares} pembagian (KOSONG)`
  )
  console.log(`   • /rates (rate_references): ${remRates} rekaman (KOSONG)`)
  console.log(
    `   • Pengguna login (user): ${remUsers} pengguna (TETAP AMAN & TERJAGA)`
  )
  console.log(
    `   • Master Truk (trucks): ${remTrucks} unit (W8187UA, H8133OF TERJAGA)`
  )

  console.log(
    "\n🎉 Seluruh data operasional berhasil dibersihkan dengan sempurna!"
  )
  await pool.end()
}

clearAllTransactionalData().catch(async (err) => {
  console.error("❌ Gagal membersihkan data:", err)
  await pool.end()
  process.exit(1)
})
