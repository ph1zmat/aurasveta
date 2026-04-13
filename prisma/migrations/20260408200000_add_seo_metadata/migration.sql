-- CreateTable
CREATE TABLE "seo_metadata" (
    "id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "keywords" TEXT,
    "og_title" TEXT,
    "og_description" TEXT,
    "og_image" TEXT,
    "canonical_url" TEXT,
    "no_index" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seo_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seo_metadata_target_type_idx" ON "seo_metadata"("target_type");

-- CreateIndex
CREATE UNIQUE INDEX "seo_metadata_target_type_target_id_key" ON "seo_metadata"("target_type", "target_id");
