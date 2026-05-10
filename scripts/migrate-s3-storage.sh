#!/usr/bin/env bash
set -euo pipefail

# === Old storage (storage-814) ===
SRC_ENDPOINT="https://storage-814.s3hoster.by"
SRC_ACCESS="ZYEAUNB4K7H8314KWFM7"
SRC_SECRET="xzP7mPGnpD3PPv0IzYiruz9WNN0FVBHUEjY9aG+Z"
SRC_BUCKET="aurabucket"

# === New storage (storage-839) ===
DST_ENDPOINT="https://storage-839.s3hoster.by"
DST_ACCESS="KPJJNRXAUIJCF65T0HX1"
DST_SECRET="XAlDgHo+6pQ2XvHWFNw+oVoXY+JefyLdeut449Am"
DST_BUCKET="aurabacket"

echo "=== S3 Storage Migration: 814 -> 839 ==="
echo "SRC: $SRC_ENDPOINT / $SRC_BUCKET"
echo "DST: $DST_ENDPOINT / $DST_BUCKET"
echo ""

# Install rclone if not present
if ! command -v rclone &>/dev/null; then
  echo "[*] Installing rclone..."
  curl -fsSL https://rclone.org/install.sh | bash
fi
echo "[ok] rclone: $(rclone version | head -1)"

# Write rclone config
RCLONE_CONF=$(mktemp /tmp/rclone-XXXXXX.conf)
cat > "$RCLONE_CONF" <<EOF
[src]
type = s3
provider = Other
env_auth = false
access_key_id = $SRC_ACCESS
secret_access_key = $SRC_SECRET
endpoint = $SRC_ENDPOINT
force_path_style = true
region = us-east-1

[dst]
type = s3
provider = Other
env_auth = false
access_key_id = $DST_ACCESS
secret_access_key = $DST_SECRET
endpoint = $DST_ENDPOINT
force_path_style = true
region = us-east-1
EOF

echo ""
echo "[1/3] Listing source bucket objects..."
rclone --config "$RCLONE_CONF" ls "src:$SRC_BUCKET" | wc -l | xargs echo "  Files count:"

echo ""
echo "[2/3] Copying files src -> dst (--progress, skip existing)..."
rclone --config "$RCLONE_CONF" \
  copy "src:$SRC_BUCKET" "dst:$DST_BUCKET" \
  --progress \
  --transfers 8 \
  --checkers 16 \
  --s3-chunk-size 32M \
  --retries 3

echo ""
echo "[3/3] Verifying: counting files in destination..."
DST_COUNT=$(rclone --config "$RCLONE_CONF" ls "dst:$DST_BUCKET" | wc -l)
SRC_COUNT=$(rclone --config "$RCLONE_CONF" ls "src:$SRC_BUCKET" | wc -l)
echo "  Source  files: $SRC_COUNT"
echo "  Dest    files: $DST_COUNT"

rm -f "$RCLONE_CONF"

if [ "$SRC_COUNT" -eq "$DST_COUNT" ]; then
  echo ""
  echo "✅ Migration complete! All $DST_COUNT files copied."
else
  echo ""
  echo "⚠️  Count mismatch: src=$SRC_COUNT dst=$DST_COUNT — check rclone output above."
fi
