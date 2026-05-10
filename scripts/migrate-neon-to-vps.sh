#!/usr/bin/env bash
set -euo pipefail

SRC_URL="postgresql://neondb_owner:npg_VjThbI7kc5Ge@ep-still-morning-amyfkxhy-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require"
SRC_URL="postgresql://neondb_owner:npg_VjThbI7kc5Ge@ep-still-morning-amyfkxhy-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&sslrootcert=system"
SRC_URL="postgresql://neondb_owner:npg_VjThbI7kc5Ge@ep-still-morning-amyfkxhy-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&sslrootcert=system"

cd /var/www/aurasveta/current
set -a
. ./.env.production
set +a
TARGET_URL="$DATABASE_URL"

echo "=== Migration: Neon -> VPS PostgreSQL ==="
echo "SRC : $SRC_URL"
echo "DST : $TARGET_URL"

TS=$(date +%Y%m%d-%H%M%S)
OUT_DIR=/var/www/aurasveta/shared/db-migration
mkdir -p "$OUT_DIR"

TARGET_BACKUP="$OUT_DIR/target-preimport-$TS.dump"
SOURCE_DUMP="$OUT_DIR/source-neon-$TS.dump"

echo ""
echo "[1/6] Backup current VPS DB -> $TARGET_BACKUP"
pg_dump "$TARGET_URL" -Fc -f "$TARGET_BACKUP"
echo "      Backup size: $(du -sh "$TARGET_BACKUP" | cut -f1)"

echo ""
echo "[2/6] Dump source Neon DB -> $SOURCE_DUMP"
pg_dump "$SRC_URL" -Fc --no-owner --no-privileges -f "$SOURCE_DUMP"
echo "      Dump size: $(du -sh "$SOURCE_DUMP" | cut -f1)"

echo ""
echo "[3/6] Stop app service"
systemctl stop aurasveta

echo ""
echo "[4/6] Restore dump into target DB (--clean drops existing objects first)"
pg_restore --clean --if-exists --no-owner --no-privileges -d "$TARGET_URL" "$SOURCE_DUMP" 2>&1 | tail -20 || true

echo ""
echo "[5/6] Start app service"
systemctl start aurasveta

echo ""
echo "[6/6] Quick DB check"
psql "$TARGET_URL" -c "
SELECT relname AS \"table\", n_live_tup::bigint AS est_rows
FROM pg_stat_user_tables
WHERE relname IN ('users','products','orders','categories','pages','settings','properties','section_types')
ORDER BY relname;
"

systemctl is-active aurasveta
echo ""
echo "DONE — backup saved at: $TARGET_BACKUP"
