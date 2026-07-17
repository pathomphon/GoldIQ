CREATE TABLE "gold_transactions" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "purchased_at" TIMESTAMP(3) NOT NULL,
  "purchase_price" DECIMAL(12,2) NOT NULL,
  "investment_amount" DECIMAL(14,2) NOT NULL,
  "gold_weight" DECIMAL(14,6) NOT NULL,
  "fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "gold_transactions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "gold_transactions_purchase_price_positive"
    CHECK ("purchase_price" > 0),
  CONSTRAINT "gold_transactions_investment_amount_positive"
    CHECK ("investment_amount" > 0),
  CONSTRAINT "gold_transactions_gold_weight_positive"
    CHECK ("gold_weight" > 0),
  CONSTRAINT "gold_transactions_fee_nonnegative"
    CHECK ("fee" >= 0)
);

CREATE INDEX "gold_transactions_product_id_idx"
  ON "gold_transactions"("product_id");
CREATE INDEX "gold_transactions_purchased_at_idx"
  ON "gold_transactions"("purchased_at" DESC);

ALTER TABLE "gold_transactions"
  ADD CONSTRAINT "gold_transactions_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "gold_products"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
