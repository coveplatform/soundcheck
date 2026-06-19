#!/usr/bin/env bash
#
# Migrate the MixReflect Postgres database from one Neon region to another
# (Singapore ap-southeast-1  ->  US East us-east-1) via a full dump + restore.
#
# Nothing secret is hardcoded — both connection strings are passed as args.
# ALWAYS use the *unpooled* (direct) endpoints: the -pooler/pgbouncer host
# can't run the session-level operations pg_dump/pg_restore need.
#
# Usage:
#   scripts/migrate-db-region.sh "<OLD_UNPOOLED_URL>" "<NEW_UNPOOLED_URL>"
#
# Example (old URL lives in .env.vercel-prod as DATABASE_URL_UNPOOLED):
#   scripts/migrate-db-region.sh \
#     "postgresql://neondb_owner:***@ep-rough-sea-a1lcoouv.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" \
#     "postgresql://neondb_owner:***@ep-restless-frog-ai62b3tb.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
#
set -euo pipefail

OLD_URL="${1:-}"
NEW_URL="${2:-}"
DUMP_FILE="${DUMP_FILE:-mr-$(date +%s 2>/dev/null || echo dump).dump}"

if [[ -z "$OLD_URL" || -z "$NEW_URL" ]]; then
  echo "usage: $0 \"<OLD_UNPOOLED_URL>\" \"<NEW_UNPOOLED_URL>\"" >&2
  exit 1
fi

# --- preflight ---------------------------------------------------------------
for bin in pg_dump pg_restore psql; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "ERROR: '$bin' not found on PATH." >&2
    echo "Install the Postgres client tools (v17 to match Neon):" >&2
    echo "  winget install PostgreSQL.PostgreSQL    # then reopen the shell" >&2
    exit 1
  fi
done

for label in "OLD:$OLD_URL" "NEW:$NEW_URL"; do
  name="${label%%:*}"; url="${label#*:}"
  case "$url" in
    *-pooler.*) echo "ERROR: $name URL points at the -pooler host. Use the UNPOOLED/direct URL." >&2; exit 1 ;;
  esac
done

echo "==> pg_dump version: $(pg_dump --version)"
echo "==> Dumping OLD database -> $DUMP_FILE"
# -Fc custom format (compressed, parallel-restore capable); --no-owner/--no-acl
# so it restores cleanly under the new DB's neondb_owner role.
pg_dump "$OLD_URL" -Fc --no-owner --no-acl -f "$DUMP_FILE"
echo "    dump size: $(du -h "$DUMP_FILE" 2>/dev/null | cut -f1 || echo '?')"

echo "==> Restoring into NEW database"
# --clean --if-exists makes this safe to re-run; harmless on a fresh empty DB.
pg_restore --no-owner --no-acl --clean --if-exists --exit-on-error \
  -d "$NEW_URL" "$DUMP_FILE"

# --- verify: row counts side by side ----------------------------------------
echo "==> Verifying row counts (old vs new)"
TABLES=$(psql "$NEW_URL" -At -c \
  "select table_name from information_schema.tables where table_schema='public' order by table_name;")

printf "%-34s %12s %12s\n" "table" "old" "new"
mismatch=0
while IFS= read -r t; do
  [[ -z "$t" ]] && continue
  oc=$(psql "$OLD_URL" -At -c "select count(*) from \"$t\";" 2>/dev/null || echo "ERR")
  nc=$(psql "$NEW_URL" -At -c "select count(*) from \"$t\";" 2>/dev/null || echo "ERR")
  flag=""
  if [[ "$oc" != "$nc" ]]; then flag="  <-- MISMATCH"; mismatch=1; fi
  printf "%-34s %12s %12s%s\n" "$t" "$oc" "$nc" "$flag"
done <<< "$TABLES"

echo
if [[ "$mismatch" == "1" ]]; then
  echo "RESULT: row counts differ — investigate before cutting over." >&2
  exit 1
fi
echo "RESULT: all table counts match. Safe to flip Production env vars + redeploy."
echo "Reminder: delete the dump when done -> rm '$DUMP_FILE'"
