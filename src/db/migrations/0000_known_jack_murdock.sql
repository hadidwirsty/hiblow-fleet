CREATE TABLE "trucks" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"plate_number" varchar(20) NOT NULL,
	"brand_model" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_name" varchar(50) NOT NULL,
	"city" varchar(100) NOT NULL,
	"destination" varchar(255) NOT NULL,
	"rate_per_ton" numeric(12, 2) NOT NULL,
	"standard_tonnage" numeric(6, 2) DEFAULT '31.00' NOT NULL,
	"sangu_percentage" numeric(5, 4) NOT NULL,
	"additional_tonnage_rate" numeric(12, 2) DEFAULT '25000.00' NOT NULL,
	"has_special_deductions" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"truck_id" varchar(20) NOT NULL,
	"order_number" integer NOT NULL,
	"order_date" date NOT NULL,
	"unloading_date" date,
	"rate_reference_id" uuid,
	"destination_city" varchar(100) NOT NULL,
	"destination_name" varchar(255) NOT NULL,
	"rate_per_ton" numeric(12, 2) NOT NULL,
	"loaded_tonnage" numeric(6, 2),
	"unloaded_tonnage" numeric(6, 2) NOT NULL,
	"omset" numeric(14, 2) NOT NULL,
	"sangu" numeric(14, 2) NOT NULL,
	"incentive_rate" numeric(10, 2) DEFAULT '35000.00' NOT NULL,
	"incentive_paid" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"incentive_status" varchar(100),
	"third_party_fee" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"third_party_name" varchar(100),
	"third_party_status" varchar(100),
	"tax_1pct" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"deduction_2pct_lju" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"deduction_5pct_uj_grb" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"meal_allowance" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"savings" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"claim" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"claim_driver" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"profit" numeric(14, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"truck_id" varchar(20) NOT NULL,
	"expense_date" date NOT NULL,
	"category" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"admin_fee" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"location" varchar(100),
	"repair_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profit_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period_id" uuid NOT NULL,
	"partner_name" varchar(100) NOT NULL,
	"partner_user_id" text,
	"capital_share" numeric(15, 2) NOT NULL,
	"share_percentage" numeric(8, 6) NOT NULL,
	"payout_amount" numeric(14, 2) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "profit_sharing_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(100) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"total_income" numeric(15, 2) NOT NULL,
	"total_expenses" numeric(15, 2) NOT NULL,
	"gross_balance" numeric(15, 2) NOT NULL,
	"manager_commission_rate" numeric(5, 4) DEFAULT '0.0500' NOT NULL,
	"manager_commission_amount" numeric(14, 2) NOT NULL,
	"distributable_profit" numeric(15, 2) NOT NULL,
	"fleet_valuation" numeric(15, 2) DEFAULT '580000000.00' NOT NULL,
	"manager_profit" numeric(15, 2) NOT NULL,
	"manager_take_home" numeric(15, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'partner' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_truck_id_trucks_id_fk" FOREIGN KEY ("truck_id") REFERENCES "public"."trucks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_rate_reference_id_rate_references_id_fk" FOREIGN KEY ("rate_reference_id") REFERENCES "public"."rate_references"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_truck_id_trucks_id_fk" FOREIGN KEY ("truck_id") REFERENCES "public"."trucks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profit_shares" ADD CONSTRAINT "profit_shares_period_id_profit_sharing_periods_id_fk" FOREIGN KEY ("period_id") REFERENCES "public"."profit_sharing_periods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;