ALTER TABLE "rate_references" ADD COLUMN "zone_code" varchar(50);--> statement-breakpoint
ALTER TABLE "rate_references" ADD COLUMN "saving_5_percent" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "rate_references" ADD COLUMN "deduction_2_percent" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "rate_references" ADD COLUMN "lju_deduction" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "rate_references" ADD COLUMN "oa_driver" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "rate_references" ADD COLUMN "estimated_revenue" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "rate_references" ADD COLUMN "estimated_profit_base" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "rate_references" ADD COLUMN "total_saving" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "rate_references" ADD COLUMN "estimated_profit_total" numeric(14, 2);