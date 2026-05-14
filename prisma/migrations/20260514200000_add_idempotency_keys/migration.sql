-- Add IdempotencyKey model for API deduplication
CREATE TABLE "idempotency_keys" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "key" VARCHAR(255) NOT NULL,
  "endpoint" VARCHAR(255) NOT NULL,
  "userId" VARCHAR(255),
  "response" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- Unique constraint on key + endpoint combination
CREATE UNIQUE INDEX "idempotency_keys_key_endpoint_unique" ON "idempotency_keys"("key", "endpoint");

-- Index for TTL cleanup queries
CREATE INDEX "idempotency_keys_createdAt_idx" ON "idempotency_keys"("createdAt");