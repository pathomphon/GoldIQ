CREATE TABLE "news_articles" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "canonical_url" TEXT NOT NULL,
    "url_hash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "source_tier" TEXT NOT NULL DEFAULT 'PRIMARY',
    "published_at" TIMESTAMP(3) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_hash" TEXT NOT NULL,

    CONSTRAINT "news_articles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "news_articles_url_hash_key" ON "news_articles"("url_hash");
CREATE UNIQUE INDEX "news_articles_source_external_id_key"
    ON "news_articles"("source", "external_id");
CREATE INDEX "news_articles_published_at_idx"
    ON "news_articles"("published_at" DESC);
CREATE INDEX "news_articles_source_published_at_idx"
    ON "news_articles"("source", "published_at" DESC);
