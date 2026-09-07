import fs from "node:fs"
import path from "node:path"

import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

import { db, pool } from "./index"
import { rateReferences, trucks } from "./schema"

async function seed() {
  console.log("🌱 Starting seed...")

  // 1. Seed static trucks: W8187UA and H8133OF
  console.log("🚛 Seeding trucks...")
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

  // 2. Seed rate references from extracted canonical Excel data
  const ratesJsonPath = path.resolve(import.meta.dirname, "./data/rates.json")
  if (fs.existsSync(ratesJsonPath)) {
    console.log("🗺️ Seeding rate references from rates.json...")
    const ratesData = JSON.parse(fs.readFileSync(ratesJsonPath, "utf-8"))

    // Batch insert 50 at a time to prevent statement limits
    const batchSize = 50
    for (let i = 0; i < ratesData.length; i += batchSize) {
      const batch = ratesData.slice(i, i + batchSize)
      await db.insert(rateReferences).values(batch)
    }
    console.log(`✅ Seeded ${ratesData.length} rate references.`)
  } else {
    console.log("⚠️ rates.json not found, skipping rate references seed.")
  }

  console.log("🎉 Seeding completed successfully!")
  await pool.end()
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err)
  pool.end().finally(() => process.exit(1))
})
