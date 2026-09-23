import {
  date,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

import { rateReferences } from "./rate-references"
import { trucks } from "./trucks"

export const trips = pgTable("trips", {
  id: uuid("id").defaultRandom().primaryKey(),
  truckId: varchar("truck_id", { length: 20 })
    .references(() => trucks.id)
    .notNull(),
  orderNumber: varchar("order_number", { length: 100 }).notNull(),
  orderDate: date("order_date").notNull(),
  unloadingDate: date("unloading_date"), // Kunci pengakuan periode bagi hasil
  rateReferenceId: uuid("rate_reference_id").references(
    () => rateReferences.id
  ),
  destinationCity: varchar("destination_city", { length: 100 }).notNull(),
  destinationName: varchar("destination_name", { length: 255 }).notNull(),
  ratePerTon: numeric("rate_per_ton", { precision: 12, scale: 2 }).notNull(),
  loadedTonnage: numeric("loaded_tonnage", { precision: 6, scale: 2 }),
  unloadedTonnage: numeric("unloaded_tonnage", {
    precision: 6,
    scale: 2,
  }).notNull(),

  // Calculated fields
  omset: numeric("omset", { precision: 14, scale: 2 }).notNull(),
  sangu: numeric("sangu", { precision: 14, scale: 2 }).notNull(),
  incentiveRate: numeric("incentive_rate", { precision: 10, scale: 2 })
    .default("35000.00")
    .notNull(),
  incentivePaid: numeric("incentive_paid", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  incentiveStatus: varchar("incentive_status", { length: 100 }),

  // Third party DO fees
  thirdPartyFee: numeric("third_party_fee", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(),
  thirdPartyName: varchar("third_party_name", { length: 100 }),
  thirdPartyStatus: varchar("third_party_status", { length: 100 }),

  // Special deductions (active for Grobogan / PT LJU)
  tax1Pct: numeric("tax_1pct", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(),
  deduction2PctLju: numeric("deduction_2pct_lju", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(),
  deduction5PctUjGrb: numeric("deduction_5pct_uj_grb", {
    precision: 12,
    scale: 2,
  })
    .default("0.00")
    .notNull(),

  // Other deductions & claims
  mealAllowance: numeric("meal_allowance", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  savings: numeric("savings", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  claim: numeric("claim", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(),
  claimDriver: numeric("claim_driver", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(),

  // Net Profit
  profit: numeric("profit", { precision: 14, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export type Trip = typeof trips.$inferSelect
export type NewTrip = typeof trips.$inferInsert
