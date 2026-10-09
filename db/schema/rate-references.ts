import {
  boolean,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const rateReferences = pgTable("rate_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  originPlant: varchar("origin_plant", { length: 100 })
    .default("Semen Indonesia (SI) - Tuban")
    .notNull(),
  clientName: varchar("client_name", { length: 50 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  cityCode: varchar("city_code", { length: 50 }),
  destination: varchar("destination", { length: 255 }).notNull(),
  distanceKm: numeric("distance_km", { precision: 8, scale: 2 }),
  zoneCode: varchar("zone_code", { length: 50 }),
  saving5Percent: numeric("saving_5_percent", { precision: 12, scale: 2 }),
  deduction2Percent: numeric("deduction_2_percent", {
    precision: 12,
    scale: 2,
  }),
  ljuDeduction: numeric("lju_deduction", { precision: 12, scale: 2 }),
  oaDriver: numeric("oa_driver", { precision: 12, scale: 2 }),
  estimatedRevenue: numeric("estimated_revenue", { precision: 14, scale: 2 }),
  estimatedProfitBase: numeric("estimated_profit_base", {
    precision: 14,
    scale: 2,
  }),
  totalSaving: numeric("total_saving", { precision: 14, scale: 2 }),
  estimatedProfitTotal: numeric("estimated_profit_total", {
    precision: 14,
    scale: 2,
  }),
  ratePerTon: numeric("rate_per_ton", { precision: 12, scale: 2 }).notNull(),
  standardTonnage: numeric("standard_tonnage", { precision: 6, scale: 2 })
    .default("31.00")
    .notNull(),
  sanguPercentage: numeric("sangu_percentage", {
    precision: 10,
    scale: 7,
  }).notNull(),
  defaultSangu: numeric("default_sangu", { precision: 14, scale: 2 }),
  additionalTonnageRate: numeric("additional_tonnage_rate", {
    precision: 12,
    scale: 2,
  })
    .default("25000.00")
    .notNull(),
  hasSpecialDeductions: boolean("has_special_deductions")
    .default(false)
    .notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export type RateReference = typeof rateReferences.$inferSelect
export type NewRateReference = typeof rateReferences.$inferInsert
