CREATE TABLE "application_settings" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "application_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "application_settings_key_key" ON "application_settings"("key");

