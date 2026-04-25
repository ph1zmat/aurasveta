-- Migration: cms_dynamic_schema
-- Rewrites dynamic property system and adds CMS models

-- Drop old enum and property structure
ALTER TABLE "product_property_values" DROP CONSTRAINT IF EXISTS "product_property_values_product_id_property_id_key";
ALTER TABLE "product_property_values" DROP COLUMN IF EXISTS "value";

ALTER TABLE "properties" DROP COLUMN IF EXISTS "key";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "type";
ALTER TABLE "properties" DROP COLUMN IF EXISTS "options";

DROP TYPE IF EXISTS "PropertyType";

-- Add new columns to properties
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "slug" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "hasPhoto" BOOLEAN NOT NULL DEFAULT false;
UPDATE "properties" SET "slug" = id WHERE "slug" IS NULL;
ALTER TABLE "properties" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "properties_slug_key" ON "properties"("slug");

-- Create property_values table
CREATE TABLE IF NOT EXISTS "property_values" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "photo" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "property_values_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "property_values_property_id_slug_key" ON "property_values"("property_id", "slug");
CREATE INDEX IF NOT EXISTS "property_values_property_id_order_idx" ON "property_values"("property_id", "order");
ALTER TABLE "property_values" ADD CONSTRAINT "property_values_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update product_property_values to use propertyValueId FK
ALTER TABLE "product_property_values" ADD COLUMN IF NOT EXISTS "property_value_id" TEXT;
ALTER TABLE "product_property_values" DROP CONSTRAINT IF EXISTS "product_property_values_property_id_fkey";

-- Re-add FK constraints
ALTER TABLE "product_property_values" ADD CONSTRAINT "product_property_values_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_property_values" ADD CONSTRAINT "product_property_values_property_value_id_fkey" FOREIGN KEY ("property_value_id") REFERENCES "property_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- New unique index
CREATE UNIQUE INDEX IF NOT EXISTS "product_property_values_product_id_property_value_id_key" ON "product_property_values"("product_id", "property_value_id");
CREATE INDEX IF NOT EXISTS "product_property_values_property_id_idx" ON "product_property_values"("property_id");
CREATE INDEX IF NOT EXISTS "product_property_values_property_value_id_idx" ON "product_property_values"("property_value_id");

-- Add CMS columns to pages
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "content_blocks" JSONB;
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "seo" JSONB;
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "show_as_banner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "banner_image" TEXT;
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "banner_link" TEXT;
ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "is_system" BOOLEAN NOT NULL DEFAULT false;

-- Create section_types table
CREATE TABLE IF NOT EXISTS "section_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "component" TEXT NOT NULL,
    "config_schema" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "section_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "section_types_name_key" ON "section_types"("name");

-- Create home_sections table
CREATE TABLE IF NOT EXISTS "home_sections" (
    "id" TEXT NOT NULL,
    "section_type_id" TEXT NOT NULL,
    "title" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "home_sections_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "home_sections_is_active_order_idx" ON "home_sections"("is_active", "order");
ALTER TABLE "home_sections" ADD CONSTRAINT "home_sections_section_type_id_fkey" FOREIGN KEY ("section_type_id") REFERENCES "section_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create settings table
CREATE TABLE IF NOT EXISTS "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "group" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);
CREATE INDEX IF NOT EXISTS "settings_group_idx" ON "settings"("group");
CREATE INDEX IF NOT EXISTS "settings_is_public_idx" ON "settings"("is_public");
