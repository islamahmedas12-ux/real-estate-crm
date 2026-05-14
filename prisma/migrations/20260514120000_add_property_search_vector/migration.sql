-- Add tsvector generated column for full-text search on Property
ALTER TABLE "properties" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(address, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(city, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(region, '')), 'C')
  ) STORED;

-- GIN index for fast full-text search
CREATE INDEX "Property_searchVector_idx" ON "properties" USING GIN ("searchVector");