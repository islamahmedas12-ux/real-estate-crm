-- Add metadata JSON column to Activity (audit trail diff/context capture)
-- Required by activity.interceptor (UPDATE diff) and leads.service (convert context)

ALTER TABLE "activities" ADD COLUMN "metadata" JSONB;
