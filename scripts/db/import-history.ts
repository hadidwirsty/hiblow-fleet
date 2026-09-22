import fs from "node:fs"
import path from "node:path"

import dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

import { db, pool } from "@/db"
import {
  expenses,
  profitShares,
  profitSharingPeriods,
  trips,
  trucks,
} from "@/db/schema"

interface RawTrip {
  truckId: string
  orderNumber: number
  orderDate: string
  unloadingDate: string | null
  destinationCity: string
  destinationName: string
  ratePerTon: string
  loadedTonnage: string | null
  unloadedTonnage: string
  omset: string
  sangu: string
  incentiveRate: string
  incentivePaid: string
  incentiveStatus: string | null
  thirdPartyFee: string
  thirdPartyName: string | null
  thirdPartyStatus: string | null
  tax1Pct: string
  deduction2PctLju: string
  deduction5PctUjGrb: string
  mealAllowance: string
  savings: string
  claim: string
  claimDriver: string
  profit: string
  notes: string | null
}

interface RawExpense {
  truckId: string
  expenseDate: string
  category: string
  description: string
  amount: string
  adminFee: string
  location: string | null
  repairNotes: string | null
}

interface RawShare {
  partnerName: string
  capitalShare: string
  sharePercentage: string
  payoutAmount: string
  notes: string | null
}

interface RawPeriod {
  title: string
  startDate: string
  endDate: string
  totalIncome: string
  totalExpenses: string
  grossBalance: string
  managerCommissionRate: string
  managerCommissionAmount: string
  distributableProfit: string
  fleetValuation: string
  managerProfit: string
  managerTakeHome: string
  status: string
  shares: RawShare[]
}

interface HistoryData {
  trips: RawTrip[]
  expenses: RawExpense[]
  profitSharingPeriods: RawPeriod[]
}

async function importHistory() {
  console.log("🚀 Starting historical data import from Excel data...")

  const historyJsonPath = path.resolve(
    import.meta.dirname,
    "../../db/data/history.json"
  )
  if (!fs.existsSync(historyJsonPath)) {
    throw new Error(`Data file not found at ${historyJsonPath}`)
  }

  const rawData: HistoryData = JSON.parse(
    fs.readFileSync(historyJsonPath, "utf-8")
  )

  // 1. Verify trucks exist
  const existingTrucks = await db.select({ id: trucks.id }).from(trucks)
  if (existingTrucks.length < 2) {
    console.log("🚛 Ensuring static trucks exist...")
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
  }

  // 2. Clean existing historical data to ensure idempotence
  console.log("🧹 Resetting existing transactional tables for clean import...")
  await db.delete(profitShares)
  await db.delete(profitSharingPeriods)
  await db.delete(trips)
  await db.delete(expenses)

  // 3. Batch import trips
  console.log(`📦 Importing ${rawData.trips.length} trips...`)
  const batchSize = 50
  for (let i = 0; i < rawData.trips.length; i += batchSize) {
    const batch = rawData.trips.slice(i, i + batchSize)
    await db.insert(trips).values(batch)
  }
  console.log(`✅ Successfully imported ${rawData.trips.length} trips!`)

  // 4. Batch import expenses
  console.log(`📦 Importing ${rawData.expenses.length} expenses...`)
  for (let i = 0; i < rawData.expenses.length; i += batchSize) {
    const batch = rawData.expenses.slice(i, i + batchSize)
    await db.insert(expenses).values(batch)
  }
  console.log(`✅ Successfully imported ${rawData.expenses.length} expenses!`)

  // 5. Import profit sharing periods and shares
  console.log(
    `📦 Importing ${rawData.profitSharingPeriods.length} profit sharing periods...`
  )
  for (const period of rawData.profitSharingPeriods) {
    const { shares, ...periodData } = period
    const [createdPeriod] = await db
      .insert(profitSharingPeriods)
      .values(periodData)
      .returning({ id: profitSharingPeriods.id })

    if (shares && shares.length > 0) {
      await db.insert(profitShares).values(
        shares.map((s) => ({
          periodId: createdPeriod.id,
          partnerName: s.partnerName,
          capitalShare: s.capitalShare,
          sharePercentage: s.sharePercentage,
          payoutAmount: s.payoutAmount,
          notes: s.notes,
        }))
      )
    }
  }
  console.log(
    `✅ Successfully imported ${rawData.profitSharingPeriods.length} profit sharing periods!`
  )

  console.log("\n==========================================")
  console.log("🎉 HISTORICAL DATA IMPORT COMPLETED 100%!")
  console.log(`🚛 Trips: ${rawData.trips.length}`)
  console.log(`🧾 Expenses: ${rawData.expenses.length}`)
  console.log(
    `📊 Profit Sharing Periods: ${rawData.profitSharingPeriods.length}`
  )
  console.log("==========================================\n")

  await pool.end()
}

importHistory().catch((err) => {
  console.error("❌ Import failed:", err)
  pool.end().finally(() => process.exit(1))
})
