#!/usr/bin/env bash
set -euo pipefail

mode="${1:---fresh}"
case "$mode" in
  --fresh) ;;
  --upgrade)
    echo "Upgrade fixture is introduced with the 19.0.2.0.0 migration task." >&2
    exit 2
    ;;
  *)
    echo "Usage: $0 [--fresh|--upgrade]" >&2
    exit 2
    ;;
esac

project_name="facodi_test_${GITHUB_RUN_ID:-local}_$$"
database="facodi_test"

cleanup() {
  docker compose --project-name "$project_name" down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker compose --project-name "$project_name" up --detach --wait db
docker compose --project-name "$project_name" run --rm odoo \
  odoo \
  --config=/etc/odoo/odoo.conf \
  --database="$database" \
  --init=facodi_content \
  --test-enable \
  --test-tags=/facodi_content \
  --stop-after-init \
  --log-level=test
