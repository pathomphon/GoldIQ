CREATE TYPE "MarketBriefStance" AS ENUM ('BULLISH', 'NEUTRAL', 'BEARISH');

CREATE TABLE "market_briefs" (
    "id" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "stance" "MarketBriefStance" NOT NULL,
    "confidence" DECIMAL(4,3) NOT NULL,
    "summary" TEXT NOT NULL,
    "bullish_factors" JSONB NOT NULL,
    "bearish_factors" JSONB NOT NULL,
    "risk_flags" JSONB NOT NULL,
    "unknowns" JSONB NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "response_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_briefs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "market_brief_evidence" (
    "brief_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,

    CONSTRAINT "market_brief_evidence_pkey" PRIMARY KEY ("brief_id", "article_id")
);

CREATE INDEX "market_briefs_generated_at_idx" ON "market_briefs"("generated_at" DESC);
CREATE INDEX "market_briefs_expires_at_idx" ON "market_briefs"("expires_at");
CREATE INDEX "market_brief_evidence_article_id_idx"
    ON "market_brief_evidence"("article_id");

ALTER TABLE "market_brief_evidence"
    ADD CONSTRAINT "market_brief_evidence_brief_id_fkey"
    FOREIGN KEY ("brief_id") REFERENCES "market_briefs"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "market_brief_evidence"
    ADD CONSTRAINT "market_brief_evidence_article_id_fkey"
    FOREIGN KEY ("article_id") REFERENCES "news_articles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
