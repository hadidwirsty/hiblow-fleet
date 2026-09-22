/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "node:fs"
import path from "node:path"
import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

import { db, pool } from "@/db"
import { rateReferences, trips } from "@/db/schema"
import { eq, isNotNull } from "drizzle-orm"

async function clearRates() {
  console.log("🧹 Memulai proses pembersihan seluruh data tarif (/rates)...")

  // 1. Backup data saat ini sebelum dihapus
  console.log("📦 1. Membuat cadangan (backup) data rate_references...")
  const allRates = await db.select().from(rateReferences)
  const backupPath = path.resolve("./db/data/backup-rate-references.json")
  fs.writeFileSync(backupPath, JSON.stringify(allRates, null, 2), "utf-8")
  console.log(`   ✅ Tersimpan ${allRates.length} data tarif ke ${backupPath}`)

  // 2. Lepaskan relasi foreign key pada tabel trips agar tidak melanggar constraint
  console.log("🔗 2. Memeriksa relasi ke tabel riwayat ritase (trips)...")
  const referencingTrips = await db
    .select({ id: trips.id, orderNumber: trips.orderNumber })
    .from(trips)
    .where(isNotNull(trips.rateReferenceId))

  if (referencingTrips.length > 0) {
    console.log(
      `   ⚠️ Ditemukan ${referencingTrips.length} ritase yang terhubung ke rate_reference_id.`
    )
    console.log(
      "   🔄 Melepaskan foreign key (set ke NULL) tanpa menghapus data ritase/keuangan..."
    )
    await db
      .update(trips)
      .set({ rateReferenceId: null })
      .where(isNotNull(trips.rateReferenceId))
    console.log("   ✅ Foreign key pada tabel trips berhasil dilepas.")
  } else {
    console.log("   ✅ Tidak ada ritase yang mengunci data tarif.")
  }

  // 3. Hapus seluruh data rate_references
  console.log("🗑️ 3. Menghapus seluruh rekaman dari tabel rate_references...")
  const deleted = await db
    .delete(rateReferences)
    .returning({ id: rateReferences.id })
  console.log(`   ✅ Berhasil menghapus ${deleted.length} data tarif!`)

  // 4. Verifikasi sisa data
  const remaining = await db.select().from(rateReferences)
  console.log(
    `🔍 4. Verifikasi sisa data di database: ${remaining.length} rekaman.`
  )

  const totalTrips = await db.select().from(trips)
  console.log(
    `🚛 5. Verifikasi total data ritase tetap aman: ${totalTrips.length} ritase.`
  )

  console.log("\n🎉 Seluruh data /rates berhasil dibersihkan dengan aman!")
  await pool.end()
}

clearRates().catch(async (err) => {
  console.error("❌ Gagal membersihkan data tarif:", err)
  await pool.end()
  process.exit(1)
})
