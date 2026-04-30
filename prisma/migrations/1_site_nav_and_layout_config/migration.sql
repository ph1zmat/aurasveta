-- Create SiteNavZone enum
DO $$ BEGIN
    CREATE TYPE "SiteNavZone" AS ENUM (
        'HEADER_TOP_LEFT',
        'HEADER_TOP_RIGHT',
        'FOOTER_ABOUT',
        'FOOTER_SERVICE',
        'FOOTER_BRANDS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add header_config and footer_config to store_settings if not exists
ALTER TABLE store_settings
    ADD COLUMN IF NOT EXISTS header_config JSONB NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS footer_config JSONB NOT NULL DEFAULT '{}';

-- Add is_visible column to site_nav_items if not exists
ALTER TABLE site_nav_items
    ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT true;

-- Drop existing data in site_nav_items (dev data, safe to clear)
DELETE FROM site_nav_items;

-- Drop old NavZone column and add new SiteNavZone column
-- (can't cast enum to enum directly, so drop & recreate)
ALTER TABLE site_nav_items DROP COLUMN zone;
ALTER TABLE site_nav_items ADD COLUMN zone "SiteNavZone" NOT NULL DEFAULT 'HEADER_TOP_LEFT';

-- Add missing indexes
CREATE UNIQUE INDEX IF NOT EXISTS "site_nav_items_page_id_zone_key" ON site_nav_items (page_id, zone);
CREATE INDEX IF NOT EXISTS "site_nav_items_zone_order_idx" ON site_nav_items (zone, "order");
CREATE INDEX IF NOT EXISTS "site_nav_items_is_visible_idx" ON site_nav_items (is_visible);
