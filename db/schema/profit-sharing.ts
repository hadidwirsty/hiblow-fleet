import {
  date,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

export const profitSharingPeriods = pgTable("profit_sharing_periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 100 }).notNull(), // 'Bagi Hasil September 2025'
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  totalIncome: numeric("total_income", { precision: 15, scale: 2 }).notNull(),
  totalExpenses: numeric("total_expenses", {
    precision: 15,
    scale: 2,
  }).notNull(),
  grossBalance: numeric("gross_balance", { precision: 15, scale: 2 }).notNull(),
  managerCommissionRate: numeric("manager_commission_rate", {
    precision: 5,
    scale: 4,
  })
    .default("0.0500")
    .notNull(),
  managerCommissionAmount: numeric("manager_commission_amount", {
    precision: 14,
    scale: 2,
  }).notNull(),
  distributableProfit: numeric("distributable_profit", {
    precision: 15,
    scale: 2,
  }).notNull(),
  fleetValuation: numeric("fleet_valuation", { precision: 15, scale: 2 })
    .default("580000000.00")
    .notNull(),
  managerProfit: numeric("manager_profit", {
    precision: 15,
    scale: 2,
  }).notNull(),
  managerTakeHome: numeric("manager_take_home", {
    precision: 15,
    scale: 2,
  }).notNull(),
  status: varchar("status", { length: 20 }).default("draft").notNull(), // 'draft', 'finalized'
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const profitShares = pgTable("profit_shares", {
  id: uuid("id").defaultRandom().primaryKey(),
  periodId: uuid("period_id")
    .references(() => profitSharingPeriods.id, { onDelete: "cascade" })
    .notNull(),
  partnerName: varchar("partner_name", { length: 100 }).notNull(),
  partnerUserId: text("partner_user_id"), // Optional link to user account
  capitalShare: numeric("capital_share", { precision: 15, scale: 2 }).notNull(),
  sharePercentage: numeric("share_percentage", {
    precision: 8,
    scale: 6,
  }).notNull(),
  payoutAmount: numeric("payout_amount", { precision: 14, scale: 2 }).notNull(),
  notes: text("notes"),
})

export type ProfitSharingPeriod = typeof profitSharingPeriods.$inferSelect
export type NewProfitSharingPeriod = typeof profitSharingPeriods.$inferInsert
export type ProfitShare = typeof profitShares.$inferSelect
export type NewProfitShare = typeof profitShares.$inferInsert
