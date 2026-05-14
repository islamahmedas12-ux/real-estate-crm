-- Add missing indexes for query performance

-- Lead.clientId already indexed via @@index([clientId]) in schema.prisma

-- Contract.startDate and Contract.endDate (added to schema.prisma)
CREATE INDEX "contracts_startDate_idx" ON "contracts"("startDate");
CREATE INDEX "contracts_endDate_idx" ON "contracts"("endDate");

-- Note: Invoice.paidDate already covered by composite @@index([status, paidDate])
-- Client.email already has @@unique which creates a b-tree index