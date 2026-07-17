CREATE TABLE "gold_products" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "purity" DECIMAL(5,2) NOT NULL,
  "source_product_code" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "gold_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gold_prices" (
  "id" TEXT NOT NULL,
  "product_id" TEXT NOT NULL,
  "buy_price" DECIMAL(12,2) NOT NULL,
  "sell_price" DECIMAL(12,2) NOT NULL,
  "buy_change" DECIMAL(12,2),
  "sell_change" DECIMAL(12,2),
  "source" TEXT NOT NULL,
  "source_updated_at" TIMESTAMP(3) NOT NULL,
  "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "raw_response_hash" TEXT NOT NULL,

  CONSTRAINT "gold_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "gold_products_code_key" ON "gold_products"("code");
CREATE UNIQUE INDEX "gold_prices_product_id_raw_response_hash_key"
  ON "gold_prices"("product_id", "raw_response_hash");
CREATE INDEX "gold_prices_product_id_source_updated_at_idx"
  ON "gold_prices"("product_id", "source_updated_at" DESC);
CREATE INDEX "gold_prices_source_updated_at_idx"
  ON "gold_prices"("source_updated_at" DESC);

ALTER TABLE "gold_prices"
  ADD CONSTRAINT "gold_prices_product_id_fkey"
  FOREIGN KEY ("product_id") REFERENCES "gold_products"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
