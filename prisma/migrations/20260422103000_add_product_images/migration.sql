-- Create normalized product image gallery table
CREATE TABLE IF NOT EXISTS "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "original_name" TEXT,
    "size" INTEGER,
    "mime_type" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "product_images_product_id_idx" ON "product_images"("product_id");
CREATE INDEX IF NOT EXISTS "product_images_product_id_is_main_idx" ON "product_images"("product_id", "is_main");

-- 1) Backfill main image from legacy image_path / image_original_name
INSERT INTO "product_images" (
    "id",
    "product_id",
    "url",
    "key",
    "original_name",
    "size",
    "mime_type",
    "order",
    "is_main",
    "created_at",
    "updated_at"
)
SELECT
    'pi_' || md5(p."id" || ':image_path:' || p."image_path") AS "id",
    p."id" AS "product_id",
    CASE
        WHEN p."image_path" ~ '^(https?://|/)' THEN p."image_path"
        ELSE '/api/storage/file?key=' || p."image_path"
    END AS "url",
    p."image_path" AS "key",
    NULLIF(BTRIM(p."image_original_name"), '') AS "original_name",
    NULL AS "size",
    NULL AS "mime_type",
    0 AS "order",
    true AS "is_main",
    COALESCE(p."created_at", CURRENT_TIMESTAMP) AS "created_at",
    COALESCE(p."updated_at", CURRENT_TIMESTAMP) AS "updated_at"
FROM "products" p
WHERE NULLIF(BTRIM(p."image_path"), '') IS NOT NULL;

-- 2) Backfill gallery items from legacy JSONB images (strings and objects)
WITH source_images AS (
    SELECT
        p."id" AS "product_id",
        NULLIF(BTRIM(p."image_path"), '') AS "legacy_main_key",
        image_item."value" AS "image_value",
        (image_item."ordinality" - 1) AS "array_order",
        p."created_at",
        p."updated_at"
    FROM "products" p
    CROSS JOIN LATERAL jsonb_array_elements(
        CASE
            WHEN jsonb_typeof(p."images") = 'array' THEN p."images"
            ELSE '[]'::jsonb
        END
    ) WITH ORDINALITY AS image_item("value", "ordinality")
), normalized_images AS (
    SELECT
        s."product_id",
        s."legacy_main_key",
        s."array_order",
        s."created_at",
        s."updated_at",
        CASE
            WHEN jsonb_typeof(s."image_value") = 'string'
                THEN NULLIF(BTRIM(TRIM(BOTH '"' FROM s."image_value"::text)), '')
            WHEN jsonb_typeof(s."image_value") = 'object'
                THEN NULLIF(
                    BTRIM(
                        COALESCE(
                            s."image_value" ->> 'key',
                            s."image_value" ->> 'path',
                            s."image_value" ->> 'imagePath',
                            s."image_value" ->> 'src',
                            s."image_value" ->> 'url'
                        )
                    ),
                    ''
                )
            ELSE NULL
        END AS "raw_key",
        CASE
            WHEN jsonb_typeof(s."image_value") = 'object'
                THEN NULLIF(
                    BTRIM(
                        COALESCE(
                            s."image_value" ->> 'originalName',
                            s."image_value" ->> 'name',
                            s."image_value" ->> 'fileName'
                        )
                    ),
                    ''
                )
            ELSE NULL
        END AS "original_name",
        CASE
            WHEN jsonb_typeof(s."image_value") = 'object'
                 AND COALESCE(s."image_value" ->> 'size', '') ~ '^[0-9]+$'
                THEN (s."image_value" ->> 'size')::INTEGER
            ELSE NULL
        END AS "size",
        CASE
            WHEN jsonb_typeof(s."image_value") = 'object'
                THEN NULLIF(
                    BTRIM(
                        COALESCE(
                            s."image_value" ->> 'mimeType',
                            s."image_value" ->> 'type'
                        )
                    ),
                    ''
                )
            ELSE NULL
        END AS "mime_type",
        CASE
            WHEN jsonb_typeof(s."image_value") = 'object'
                 AND COALESCE(
                    s."image_value" ->> 'order',
                    s."image_value" ->> 'position',
                    s."image_value" ->> 'index',
                    ''
                 ) ~ '^-?[0-9]+$'
                THEN COALESCE(
                    (s."image_value" ->> 'order')::INTEGER,
                    (s."image_value" ->> 'position')::INTEGER,
                    (s."image_value" ->> 'index')::INTEGER
                )
            ELSE NULL
        END AS "explicit_order",
        CASE
            WHEN jsonb_typeof(s."image_value") = 'object'
                THEN CASE LOWER(COALESCE(
                    s."image_value" ->> 'isMain',
                    s."image_value" ->> 'main',
                    s."image_value" ->> 'primary',
                    ''
                ))
                    WHEN 'true' THEN true
                    WHEN '1' THEN true
                    WHEN 'yes' THEN true
                    ELSE false
                END
            ELSE false
        END AS "explicit_is_main"
    FROM source_images s
), deduplicated_images AS (
    SELECT
        n.*,
        ROW_NUMBER() OVER (
            PARTITION BY n."product_id", n."raw_key"
            ORDER BY n."array_order" ASC
        ) AS "duplicate_rank"
    FROM normalized_images n
    WHERE n."raw_key" IS NOT NULL
)
INSERT INTO "product_images" (
    "id",
    "product_id",
    "url",
    "key",
    "original_name",
    "size",
    "mime_type",
    "order",
    "is_main",
    "created_at",
    "updated_at"
)
SELECT
    'pi_' || md5(d."product_id" || ':images:' || d."raw_key" || ':' || d."array_order") AS "id",
    d."product_id",
    CASE
        WHEN d."raw_key" ~ '^(https?://|/)' THEN d."raw_key"
        ELSE '/api/storage/file?key=' || d."raw_key"
    END AS "url",
    d."raw_key" AS "key",
    d."original_name",
    d."size",
    d."mime_type",
    CASE
        WHEN d."legacy_main_key" IS NOT NULL THEN COALESCE(d."explicit_order", d."array_order" + 1)
        ELSE COALESCE(d."explicit_order", d."array_order")
    END AS "order",
    CASE
        WHEN d."legacy_main_key" IS NOT NULL THEN false
        WHEN d."explicit_is_main" THEN true
        WHEN d."array_order" = 0 THEN true
        ELSE false
    END AS "is_main",
    COALESCE(d."created_at", CURRENT_TIMESTAMP) AS "created_at",
    COALESCE(d."updated_at", CURRENT_TIMESTAMP) AS "updated_at"
FROM deduplicated_images d
WHERE d."duplicate_rank" = 1
  AND (d."legacy_main_key" IS NULL OR d."raw_key" IS DISTINCT FROM d."legacy_main_key");

-- 3) Normalize main image flag so that each product keeps exactly one main image
WITH ranked_images AS (
    SELECT
        pi."id",
        ROW_NUMBER() OVER (
            PARTITION BY pi."product_id"
            ORDER BY
                pi."is_main" DESC,
                pi."order" ASC,
                pi."created_at" ASC,
                pi."id" ASC
        ) AS "main_rank"
    FROM "product_images" pi
)
UPDATE "product_images" pi
SET "is_main" = ranked."main_rank" = 1
FROM ranked_images ranked
WHERE ranked."id" = pi."id";

-- 4) Drop legacy product image columns after successful data transfer
ALTER TABLE "products" DROP COLUMN IF EXISTS "images";
ALTER TABLE "products" DROP COLUMN IF EXISTS "image_path";
ALTER TABLE "products" DROP COLUMN IF EXISTS "image_original_name";
