CREATE TYPE "BuyPlanLevelStatus" AS ENUM ('WAITING', 'TRIGGERED', 'EXECUTED', 'CANCELLED');
CREATE TYPE "AlertDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'SKIPPED', 'FAILED');

CREATE TABLE "buy_plans" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "buy_plans_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "buy_plans_name_not_blank" CHECK (length(btrim("name")) > 0),
  CONSTRAINT "buy_plans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "gold_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "buy_plan_levels" (
  "id" TEXT NOT NULL,
  "buy_plan_id" TEXT NOT NULL,
  "target_price" DECIMAL(12,2) NOT NULL,
  "investment_amount" DECIMAL(14,2) NOT NULL,
  "sequence" INTEGER NOT NULL,
  "status" "BuyPlanLevelStatus" NOT NULL DEFAULT 'WAITING',
  "triggered_at" TIMESTAMP(3),
  "executed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "buy_plan_levels_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "buy_plan_levels_target_price_positive" CHECK ("target_price" > 0),
  CONSTRAINT "buy_plan_levels_investment_amount_positive" CHECK ("investment_amount" > 0),
  CONSTRAINT "buy_plan_levels_sequence_positive" CHECK ("sequence" > 0),
  CONSTRAINT "buy_plan_levels_buy_plan_id_fkey" FOREIGN KEY ("buy_plan_id") REFERENCES "buy_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "alert_events" (
  "id" TEXT NOT NULL,
  "buy_plan_level_id" TEXT NOT NULL,
  "observed_price" DECIMAL(12,2) NOT NULL,
  "message" TEXT NOT NULL,
  "delivery_status" "AlertDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "delivery_error" TEXT,
  "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "alert_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "alert_events_observed_price_positive" CHECK ("observed_price" > 0),
  CONSTRAINT "alert_events_buy_plan_level_id_fkey" FOREIGN KEY ("buy_plan_level_id") REFERENCES "buy_plan_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "buy_plans_product_id_idx" ON "buy_plans"("product_id");
CREATE INDEX "buy_plans_is_active_created_at_idx" ON "buy_plans"("is_active", "created_at" DESC);
CREATE UNIQUE INDEX "buy_plan_levels_buy_plan_id_sequence_key" ON "buy_plan_levels"("buy_plan_id", "sequence");
CREATE INDEX "buy_plan_levels_buy_plan_id_idx" ON "buy_plan_levels"("buy_plan_id");
CREATE INDEX "buy_plan_levels_status_target_price_idx" ON "buy_plan_levels"("status", "target_price");
CREATE INDEX "alert_events_buy_plan_level_id_idx" ON "alert_events"("buy_plan_level_id");
CREATE INDEX "alert_events_triggered_at_idx" ON "alert_events"("triggered_at" DESC);
