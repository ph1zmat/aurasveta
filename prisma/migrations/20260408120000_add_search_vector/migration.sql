-- Add search_vector column to products table
ALTER TABLE "products" ADD COLUMN "search_vector" tsvector;

-- Create GIN index for full-text search
CREATE INDEX "products_search_vector_idx" ON "products" USING GIN ("search_vector");

-- Create function to update search vector
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
DECLARE
  category_name TEXT;
BEGIN
  -- Get category name if exists
  SELECT name INTO category_name FROM "categories" WHERE id = NEW.category_id;

  NEW.search_vector :=
    setweight(to_tsvector('russian', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.brand, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('russian', COALESCE(NEW.sku, '')), 'B') ||
    setweight(to_tsvector('russian', COALESCE(category_name, '')), 'C');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating search vector
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE OF name, description, brand, sku, category_id
  ON "products"
  FOR EACH ROW
  EXECUTE FUNCTION products_search_vector_update();

-- Backfill existing products
UPDATE "products" SET name = name WHERE TRUE;
