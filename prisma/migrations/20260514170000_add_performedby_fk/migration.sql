-- Add performedById FK to Activity and LeadActivity
-- Keep performedBy (text) for backward compat during transition

ALTER TABLE "activities" ADD COLUMN "performedById" TEXT;
ALTER TABLE "activities" ADD CONSTRAINT "activities_performedById_fkey"
  FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL;

ALTER TABLE "lead_activities" ADD COLUMN "performedById" TEXT;
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_performedById_fkey"
  FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL;

-- Index for FK lookups
CREATE INDEX "activities_performedById_idx" ON "activities"("performedById");
CREATE INDEX "lead_activities_performedById_idx" ON "lead_activities"("performedById");