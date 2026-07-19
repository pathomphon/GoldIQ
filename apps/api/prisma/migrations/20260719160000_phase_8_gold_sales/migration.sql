CREATE TABLE "gold_sales" (
    "id" TEXT NOT NULL,
    "purchase_transaction_id" TEXT NOT NULL,
    "sold_at" TIMESTAMP(3) NOT NULL,
    "sale_price" DECIMAL(12,2) NOT NULL,
    "gold_weight" DECIMAL(14,6) NOT NULL,
    "fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gold_sales_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "gold_sales_purchase_transaction_id_sold_at_idx"
ON "gold_sales"("purchase_transaction_id", "sold_at" DESC);

CREATE INDEX "gold_sales_sold_at_idx" ON "gold_sales"("sold_at" DESC);

ALTER TABLE "gold_sales"
ADD CONSTRAINT "gold_sales_purchase_transaction_id_fkey"
FOREIGN KEY ("purchase_transaction_id")
REFERENCES "gold_transactions"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
